#Requires -Version 7.4
param(
    [string]$Email = 'carla.tecnica@distrischool.test',
    [string]$Senha = 'Senha@123',
    [ValidateRange(1, 20)][int]$PedidosDuranteFalha = 1
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$compose = @('compose', '--project-directory', $raiz)

$endereco = docker @compose port gateway 80
if ($LASTEXITCODE -ne 0 -or -not $endereco) {
    throw 'Suba o projeto no Docker Compose antes de iniciar a demo.'
}
$gateway = "http://$endereco"
$opcoesHttp = @{
    Method = 'Post'
    ContentType = 'application/json'
    ConnectionTimeoutSeconds = 35
    OperationTimeoutSeconds = 35
    NoProxy = $true
}

$login = Invoke-RestMethod @opcoesHttp -Uri "$gateway/api/auth/login" -Body (
    @{email = $Email; senha = $Senha} | ConvertTo-Json -Compress
)
$headers = @{Authorization = "Bearer $($login.access_token)"}
$matricula = @{aluno_id = 1; turma_id = 2147483647} | ConvertTo-Json -Compress

function Testar-Matricula {
    $relogio = [System.Diagnostics.Stopwatch]::StartNew()
    $resposta = Invoke-RestMethod @opcoesHttp -Uri "$gateway/api/matriculas" `
        -Headers $headers -Body $matricula -SkipHttpErrorCheck -StatusCodeVariable codigo
    [pscustomobject]@{Codigo = $codigo; Detalhe = $resposta.detail; TempoMs = $relogio.ElapsedMilliseconds}
}

function Confirmar-Resposta($Resultado, [int]$Codigo, [string]$Detalhe) {
    if ($Resultado.Codigo -ne $Codigo -or $Resultado.Detalhe -ne $Detalhe) {
        throw "Esperava HTTP $Codigo ($Detalhe). Recebi HTTP $($Resultado.Codigo) ($($Resultado.Detalhe))."
    }
}

$inicial = Testar-Matricula
Confirmar-Resposta $inicial 404 'Turma não encontrada'
Write-Host "Antes da falha: HTTP 404 ($($inicial.Detalhe))."

try {
    docker @compose stop administrativo-service
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao parar o serviço administrativo.' }

    for ($pedido = 1; $pedido -le $PedidosDuranteFalha; $pedido++) {
        $falha = Testar-Matricula
        Confirmar-Resposta $falha 503 'Serviço administrativo indisponível'
        Write-Host "Pedido $pedido durante a falha: HTTP 503 em $($falha.TempoMs) ms."
    }
} finally {
    docker @compose start --wait --wait-timeout 45 administrativo-service
    if ($LASTEXITCODE -ne 0) { throw 'O serviço administrativo não voltou a ficar saudável.' }
}

$prazo = [DateTime]::UtcNow.AddSeconds(45)
do {
    $recuperacao = Testar-Matricula
    if ($recuperacao.Codigo -eq 404) {
        Confirmar-Resposta $recuperacao 404 'Turma não encontrada'
        Write-Host "Após a recuperação: HTTP 404 ($($recuperacao.Detalhe))."
        return
    }
    Confirmar-Resposta $recuperacao 503 'Serviço administrativo indisponível'
    Start-Sleep -Seconds 1
} while ([DateTime]::UtcNow -lt $prazo)

throw 'O acadêmico não voltou a consultar o administrativo no tempo esperado.'
