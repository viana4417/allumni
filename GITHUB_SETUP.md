# Como enviar para o GitHub

## Passo 1: Criar repositório no GitHub
1. Acesse https://github.com/new
2. Escolha um nome para o repositório (ex: `pce` ou `login-page`)
3. **NÃO** marque as opções de README, .gitignore ou licença
4. Clique em "Create repository"

## Passo 2: Conectar e enviar
Depois de criar o repositório, execute estes comandos (substitua `SEU_USUARIO` e `NOME_DO_REPO`):

```bash
cd "/home/peleador/Área de trabalho/pce"

# Adicionar o repositório remoto (substitua SEU_USUARIO e NOME_DO_REPO)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git

# Renomear branch para 'main' (se necessário)
git branch -M main

# Enviar para o GitHub
git push -u origin main
```

## Alternativa: Usar SSH
Se você preferir usar SSH em vez de HTTPS:

```bash
git remote add origin git@github.com:SEU_USUARIO/NOME_DO_REPO.git
git branch -M main
git push -u origin main
```

## Nota sobre configuração Git
Se quiser configurar seu nome e email globalmente (para todos os repositórios):

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

