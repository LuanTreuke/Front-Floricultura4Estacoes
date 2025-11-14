# ✅ Checklist de Deploy AWS - Backend Floricultura

Use este checklist para acompanhar seu progresso no deploy.

---

## 📝 Antes de Começar

- [ ] Tenho uma conta AWS criada
- [ ] Tenho cartão de crédito cadastrado (não será cobrado se usar free tier)
- [ ] Meu backend funciona localmente
- [ ] Tenho um repositório Git (GitHub/GitLab) com o código

---

## 🖥️ Parte 1: Configurar EC2 (30 min)

- [ ] Acessei o console AWS (https://console.aws.amazon.com)
- [ ] Criei instância EC2:
  - [ ] Nome: `backend-floricultura`
  - [ ] AMI: Ubuntu Server 22.04 LTS
  - [ ] Instance type: `t2.micro` (Free tier)
  - [ ] Criei e baixei o arquivo `.pem` da chave
  - [ ] Configurei Security Group:
    - [ ] SSH (22)
    - [ ] HTTP (80)
    - [ ] HTTPS (443)
    - [ ] Custom (3001)
- [ ] Instância está rodando (status: Running)
- [ ] Anotei o IP público: `________________`

---

## 🔌 Parte 2: Conectar ao EC2 (10 min)

- [ ] Conectei via SSH:
  ```bash
  ssh -i floricultura-key.pem ubuntu@SEU-IP-PUBLICO
  ```
- [ ] Consegui acessar o terminal do servidor

---

## 📦 Parte 3: Instalar Dependências (15 min)

- [ ] Atualizei o sistema:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- [ ] Instalei Node.js 20:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- [ ] Instalei PM2:
  ```bash
  sudo npm install -g pm2
  ```
- [ ] Instalei Git:
  ```bash
  sudo apt install -y git
  ```
- [ ] Verifiquei versões:
  ```bash
  node --version  # Deve mostrar v20.x.x
  npm --version
  pm2 --version
  ```

---

## 🗄️ Parte 4: Configurar Banco de Dados (20 min)

### Opção A: MySQL na EC2 (Mais simples)

- [ ] Instalei MySQL:
  ```bash
  sudo apt install -y mysql-server
  ```
- [ ] Executei configuração de segurança:
  ```bash
  sudo mysql_secure_installation
  ```
- [ ] Criei banco e usuário:
  ```bash
  sudo mysql
  CREATE DATABASE floricultura_db;
  CREATE USER 'floricultura'@'localhost' IDENTIFIED BY 'SenhaForte123!';
  GRANT ALL PRIVILEGES ON floricultura_db.* TO 'floricultura'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
  ```

### Opção B: AWS RDS (Recomendado)

- [ ] Acessei RDS no console AWS
- [ ] Criei database:
  - [ ] Engine: MySQL
  - [ ] Template: Free tier
  - [ ] DB identifier: `floricultura-db`
  - [ ] Master username: `admin`
  - [ ] Master password: `________________` (anote!)
  - [ ] Public access: Yes
- [ ] Anotei o endpoint: `________________`
- [ ] Configurei Security Group permitindo porta 3306

---

## 🚀 Parte 5: Deploy do Backend (20 min)

- [ ] Clonei repositório:
  ```bash
  mkdir -p /home/ubuntu/apps && cd /home/ubuntu/apps
  git clone https://github.com/SEU-USUARIO/SEU-REPO.git
  cd back-tcc-floricultura
  ```
- [ ] Criei arquivo `.env`:
  ```bash
  nano .env
  ```
- [ ] Configurei variáveis no `.env`:
  ```env
  DB_HOST=localhost  # ou endpoint do RDS
  DB_PORT=3306
  DB_USERNAME=floricultura  # ou admin
  DB_PASSWORD=SenhaForte123!
  DB_DATABASE=floricultura_db
  PORT=3001
  NODE_ENV=production
  ```
- [ ] Instalei dependências:
  ```bash
  npm install
  ```
- [ ] Buildei o projeto:
  ```bash
  npm run build
  ```
- [ ] Iniciei com PM2:
  ```bash
  pm2 start dist/main.js --name backend-floricultura
  pm2 save
  pm2 startup  # Execute o comando que aparecer
  ```
- [ ] Verifiquei se está rodando:
  ```bash
  pm2 status
  pm2 logs backend-floricultura
  ```

---

## 🌐 Parte 6: Configurar NGINX (15 min)

- [ ] Instalei NGINX:
  ```bash
  sudo apt install -y nginx
  ```
- [ ] Criei configuração:
  ```bash
  sudo nano /etc/nginx/sites-available/backend-floricultura
  ```
- [ ] Copiei e colei a configuração (ver guia completo)
- [ ] Ativei o site:
  ```bash
  sudo ln -s /etc/nginx/sites-available/backend-floricultura /etc/nginx/sites-enabled/
  sudo rm /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl restart nginx
  ```
- [ ] Testei o backend:
  - Abri no navegador: `http://SEU-IP-EC2/`
  - [ ] Consegui acessar a API

---

## 🎨 Parte 7: Atualizar Frontend (5 min)

- [ ] No meu computador, editei `.env.local` do frontend:
  ```env
  NEXT_PUBLIC_API_URL=http://SEU-IP-EC2
  ```
- [ ] Reiniciei o frontend local:
  ```bash
  npm run dev
  ```
- [ ] Testei se está funcionando:
  - [ ] Consigo fazer login
  - [ ] Consigo ver produtos
  - [ ] Consigo fazer upload de imagens

---

## 🔒 Parte 8: HTTPS (Opcional - 10 min)

**⚠️ Apenas se você tiver um domínio**

- [ ] Tenho um domínio (ex: meusiteflores.com)
- [ ] Apontei o domínio para o IP do EC2
- [ ] Instalei Certbot:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  ```
- [ ] Obtive certificado SSL:
  ```bash
  sudo certbot --nginx -d meusiteflores.com
  ```
- [ ] Testei HTTPS: https://meusiteflores.com

---

## 🎉 Conclusão

- [ ] Backend está rodando em: `http://SEU-IP-EC2`
- [ ] Frontend consegue se conectar ao backend
- [ ] Upload de imagens funciona
- [ ] Banco de dados está funcionando
- [ ] PM2 reinicia automaticamente se der erro

---

## 📋 Informações Importantes

**Anote estas informações:**

- IP Público EC2: `________________`
- Endpoint RDS (se usar): `________________`
- Senha MySQL: `________________`
- Caminho da chave SSH: `________________`

**URLs:**
- Backend: `http://________________`
- Console AWS: https://console.aws.amazon.com
- PM2 no servidor: `pm2 status`

---

## 🆘 Problemas Comuns

### Backend não inicia
```bash
pm2 logs backend-floricultura
```

### Não consigo conectar ao MySQL
```bash
sudo systemctl status mysql
```

### NGINX dá erro
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Frontend não conecta ao backend
- Verifique o `.env.local` do frontend
- Verifique se o Security Group permite porta 3001
- Teste diretamente: `http://SEU-IP-EC2:3001`

---

## 🔄 Para Atualizar o Código

Quando fizer mudanças no código:

```bash
ssh -i floricultura-key.pem ubuntu@SEU-IP-EC2
cd /home/ubuntu/apps/back-tcc-floricultura
bash deploy.sh
```

---

**Tempo total estimado:** 2-3 horas  
**Custo:** GRÁTIS (free tier por 12 meses)
