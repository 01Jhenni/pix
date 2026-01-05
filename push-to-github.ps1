# Script para fazer push do projeto para o GitHub
# Uso: .\push-to-github.ps1 -GitHubUrl "https://github.com/seu-usuario/seu-repo.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUrl
)

Write-Host "Configurando repositório remoto..." -ForegroundColor Cyan
git remote add origin $GitHubUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "Tentando atualizar remote existente..." -ForegroundColor Yellow
    git remote set-url origin $GitHubUrl
}

Write-Host "Fazendo push para o GitHub..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "Repositório disponível em: $GitHubUrl" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro ao fazer push. Verifique:" -ForegroundColor Red
    Write-Host "1. Se o repositório existe no GitHub" -ForegroundColor Yellow
    Write-Host "2. Se você tem permissão para fazer push" -ForegroundColor Yellow
    Write-Host "3. Se você está autenticado no GitHub" -ForegroundColor Yellow
}

