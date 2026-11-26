"""Mede o tempo de resposta de consultas autenticadas pelo gateway local."""

import argparse
import json
import math
import os
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from http.client import HTTPConnection, HTTPException
from time import perf_counter


ROTAS = ("/api/auth/me", "/api/alunos", "/api/turmas", "/api/matriculas", "/api/notificacoes")
LIMITE_SEGUNDOS = 2


def requisitar(porta, metodo, rota, headers, corpo=None):
    conexao = HTTPConnection("127.0.0.1", porta, timeout=10)
    try:
        conexao.request(metodo, rota, body=corpo, headers=headers)
        resposta = conexao.getresponse()
        return resposta.status, resposta.read()
    finally:
        conexao.close()


def autenticar(porta):
    credenciais = {
        "email": os.getenv("CARGA_EMAIL", "carla.tecnica@distrischool.test"),
        "senha": os.getenv("CARGA_SENHA", "Senha@123"),
    }
    status, corpo = requisitar(porta, "POST", "/api/auth/login", {"Content-Type": "application/json"},
                               json.dumps(credenciais).encode())
    if status != 200:
        raise ValueError(f"HTTP {status}")
    dados = json.loads(corpo)
    if not isinstance(dados, dict) or not isinstance(dados.get("access_token"), str) or not dados["access_token"]:
        raise ValueError("resposta sem access_token")
    return dados["access_token"]


def medir(porta, rota, headers):
    inicio = perf_counter()
    try:
        status, corpo = requisitar(porta, "GET", rota, headers)
        duracao = perf_counter() - inicio
        if status == 200:
            json.loads(corpo)
        return rota, str(status), duracao
    except (HTTPException, OSError, ValueError) as erro:
        return rota, type(erro).__name__, perf_counter() - inicio


def resumir(rotulo, amostras):
    tempos = sorted(duracao for _, _, duracao in amostras)
    p95 = tempos[math.ceil(0.95 * len(tempos)) - 1]
    contagem = Counter(status for _, status, _ in amostras)
    status = ", ".join(f"{chave}={qtd}" for chave, qtd in sorted(contagem.items()))
    print(f"{rotulo:<18} {len(tempos):>6} {p95 * 1000:>10.1f} {tempos[-1] * 1000:>11.1f}   {status}")
    return contagem["200"] == len(tempos) and tempos[-1] < LIMITE_SEGUNDOS


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--porta", type=int, default=8080, help="porta do gateway em 127.0.0.1 (padrão 8080)")
    parser.add_argument("--clientes", type=int, default=8, help="requisições simultâneas de 1 a 16 (padrão 8)")
    parser.add_argument("--por-rota", type=int, default=40, help="requisições por rota de 20 a 100 (padrão 40)")
    opcoes = parser.parse_args()
    if not (1 <= opcoes.porta <= 65535 and 1 <= opcoes.clientes <= 16 and 20 <= opcoes.por_rota <= 100):
        parser.error("use porta de 1 a 65535, clientes de 1 a 16 e amostras por rota de 20 a 100")

    print(f"Gateway 127.0.0.1:{opcoes.porta} | até {opcoes.clientes} requisições simultâneas | "
          f"{opcoes.por_rota} GETs por rota | login fora da medição")
    try:
        token = autenticar(opcoes.porta)
    except (HTTPException, OSError, ValueError) as erro:
        print(f"Falha no login: {erro}", file=sys.stderr)
        return 1

    headers = {"Authorization": f"Bearer {token}"}
    inicio = perf_counter()
    with ThreadPoolExecutor(max_workers=opcoes.clientes) as executor:
        pedidos = [executor.submit(medir, opcoes.porta, rota, headers) for rota in ROTAS * opcoes.por_rota]
        amostras = [pedido.result() for pedido in pedidos]
    duracao = perf_counter() - inicio

    print(f"{'Rota':<18} {'GETs':>6} {'p95 (ms)':>10} {'máximo (ms)':>11}   Status/erros")
    aprovacoes = []
    for rota in ROTAS:
        aprovacoes.append(resumir(rota, [amostra for amostra in amostras if amostra[0] == rota]))
    resumir("Total", amostras)
    print(f"Duração: {duracao:.2f} s | vazão: {len(amostras) / duracao:.1f} req/s")
    if all(aprovacoes):
        print("APROVADO: todas as consultas responderam em menos de 2 s e zero erros.")
        return 0
    print("REPROVADO: houve erro ou alguma consulta levou 2 s ou mais.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
