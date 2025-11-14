# 🚀 Guia Completo: Deploy do Backend NestJS na AWS EC2

## 📋 Pré-requisitos

- ✅ Conta na AWS (free tier disponível)
- ✅ Backend NestJS funcionando localmente
- ✅ Banco de dados MySQL (local ou AWS RDS)

---

## Parte 1: Configurar EC2 na AWS

### 1.1 Criar Instância EC2

1. **Acesse o Console AWS:**
   - https://console.aws.amazon.com/
   - Procure por "EC2" na barra de pesquisa

2. **Launch Instance:**
   - Clique em "Launch Instance"
   - **Nome:** `backend-floricultura`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type:** `t2.micro` (Free tier)
   - **Key pair:** Crie um novo par de chaves
     - Nome: `floricultura-key`
     - **IMPORTANTE:** Baixe o arquivo `.pem` e guarde com segurança!

3. **Configurar Security Group:**
   - Permita as seguintes portas:
     - SSH (22) - Seu IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (3001) - 0.0.0.0/0 (porta do backend)

4. **Storage:** 8 GB (suficiente para o free tier)

5. **Launch Instance** e aguarde iniciar

### 1.2 Conectar ao EC2

**No Windows (PowerShell):**
```powershell
# Ir para a pasta onde está a chave .pem
cd C:\Users\SeuUsuario\Downloads

# Ajustar permissões
icacls floricultura-key.pem /inheritance:r
icacls floricultura-key.pem /grant:r "%USERNAME%":"(R)"

# Conectar via SSH
ssh -i floricultura-key.pem ubuntu@SEU-IP-PUBLICO-EC2
```

**Alternativa: Usar PuTTY:**
- Converta `.pem` para `.ppk` usando PuTTYgen
- Conecte usando PuTTY

---

## Parte 2: Instalar Dependências no EC2

### 2.1 Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalar Node.js

```bash
# Instalar Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2.3 Instalar PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2
```

### 2.4 Instalar Git

```bash
sudo apt install -y git
```

---

## Parte 3: Deploy do Backend

### 3.1 Clonar Repositório

```bash
# Criar diretório
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

# Clonar repositório (substitua pela sua URL)
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd back-tcc-floricultura
```

### 3.2 Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

**Conteúdo do .env:**
```env
# Banco de Dados
DB_HOST=seu-banco-mysql-host
DB_PORT=3306
DB_USERNAME=seu-usuario
DB_PASSWORD=sua-senha
DB_DATABASE=floricultura_db

# Porta da Aplicação
PORT=3001

# Outras configurações
NODE_ENV=production
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.3 Instalar Dependências e Buildar

```bash
# Instalar dependências
npm install

# Buildar o projeto
npm run build
```

### 3.4 Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start dist/main.js --name "backend-floricultura"

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Copie e execute o comando que aparece
```

### 3.5 Verificar Status

```bash
# Ver logs
pm2 logs backend-floricultura

# Ver status
pm2 status

# Monitorar
pm2 monit
```

---

## Parte 4: Configurar Banco de Dados MySQL

### Opção A: MySQL na mesma EC2 (Não recomendado para produção)

```bash
# Instalar MySQL
sudo apt install -y mysql-server

# Configurar MySQL
sudo mysql_secure_installation

# Acessar MySQL
sudo mysql

# Criar banco e usuário
CREATE DATABASE floricultura_db;
CREATE USER 'floricultura_user'@'localhost' IDENTIFIED BY 'senha-forte-aqui';
GRANT ALL PRIVILEGES ON floricultura_db.* TO 'floricultura_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Opção B: AWS RDS MySQL (Recomendado)

1. **No Console AWS, procure por RDS**
2. **Create database:**
   - Engine: MySQL
   - Template: Free tier
   - DB instance identifier: `floricultura-db`
   - Master username: `admin`
   - Master password: (escolha uma senha forte)
   - Public access: **Yes** (para acessar de fora)
   - VPC security group: Crie um novo permitindo porta 3306

3. **Após criar, pegue o endpoint:**
   - Endpoint: `floricultura-db.xxxxx.us-east-1.rds.amazonaws.com`
   - Use este endpoint no seu `.env` como `DB_HOST`

---

## Parte 5: Configurar NGINX (Proxy Reverso)

### 5.1 Instalar NGINX

```bash
sudo apt install -y nginx
```

### 5.2 Configurar Site

```bash
sudo nano /etc/nginx/sites-available/backend-floricultura
```

**Conteúdo:**
```nginx
server {
    listen 80;
    server_name SEU-IP-PUBLICO-EC2 ou seu-dominio.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Servir arquivos estáticos (uploads)
    location /uploads {
        alias /home/ubuntu/apps/back-tcc-floricultura/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.3 Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/backend-floricultura /etc/nginx/sites-enabled/

# Remover site default
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Parte 6: Configurar SSL com Let's Encrypt (HTTPS)

### 6.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obter Certificado SSL

**⚠️ IMPORTANTE:** Você precisa de um domínio apontando para o IP do EC2

```bash
sudo certbot --nginx -d seu-dominio.com
```

Siga as instruções e pronto! Seu backend estará em HTTPS.

---

## Parte 7: Atualizar Frontend para Usar AWS

### 7.1 Editar .env.local no Frontend

```bash
# No seu projeto front-tcc-floricultura
# Edite .env.local
NEXT_PUBLIC_API_URL=http://SEU-IP-EC2
# ou
NEXT_PUBLIC_API_URL=https://seu-dominio.com
```

### 7.2 Testar

Reinicie o frontend e teste se as requisições estão funcionando.

---

## Parte 8: Comandos Úteis

### Gerenciar Backend
```bash
# Ver logs
pm2 logs backend-floricultura

# Reiniciar
pm2 restart backend-floricultura

# Parar
pm2 stop backend-floricultura

# Remover
pm2 delete backend-floricultura
```

### Atualizar Código
```bash
cd /home/ubuntu/apps/back-tcc-floricultura
git pull
npm install
npm run build
pm2 restart backend-floricultura
```

### Ver uso de recursos
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# PM2 monitor
pm2 monit
```

---

## 🔧 Troubleshooting

### Backend não inicia
```bash
# Ver logs detalhados
pm2 logs backend-floricultura --lines 100

# Ver se a porta está em uso
sudo lsof -i :3001

# Testar backend diretamente
node dist/main.js
```

### Problemas com MySQL
```bash
# Ver status
sudo systemctl status mysql

# Ver logs
sudo journalctl -u mysql -n 50
```

### NGINX não funciona
```bash
# Ver status
sudo systemctl status nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t
```

---

## 💰 Custos Estimados (Free Tier)

- **EC2 t2.micro:** GRÁTIS (12 meses)
- **RDS MySQL t3.micro:** GRÁTIS (750h/mês por 12 meses)
- **Bandwidth:** 15GB grátis/mês
- **Elastic IP:** Grátis se associado a uma instância em execução

**Após free tier:**
- EC2: ~$8-10/mês
- RDS: ~$15-20/mês
- Total: ~$25-30/mês

---

## 📊 Próximos Passos (Opcional)

1. **Configurar backup automático do banco**
2. **Configurar monitoramento (AWS CloudWatch)**
3. **Configurar domínio personalizado**
4. **Configurar CI/CD para deploy automático**
5. **Configurar S3 para armazenar uploads (ao invés de local)**

---

## 🆘 Suporte

- Documentação AWS EC2: https://docs.aws.amazon.com/ec2/
- Documentação NestJS: https://docs.nestjs.com/
- PM2 Docs: https://pm2.keymetrics.io/docs/usage/quick-start/
