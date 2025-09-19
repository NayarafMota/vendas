from flask import Flask, render_template, request, redirect, url_for, flash
import requests
import os

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# URLs dos microserviços
PRODUTOS_SERVICE_URL = os.getenv('PRODUTOS_SERVICE_URL', 'http://localhost:3001')
CLIENTES_SERVICE_URL = os.getenv('CLIENTES_SERVICE_URL', 'http://localhost:3002')
VENDAS_SERVICE_URL = os.getenv('VENDAS_SERVICE_URL', 'http://localhost:3003')

@app.route('/')
def index():
    # Buscar clientes e produtos para exibir no formulário de venda
    clientes = []
    produtos = []
    try:
        resp_clientes = requests.get(f"{CLIENTES_SERVICE_URL}/clientes")
        if resp_clientes.status_code == 200:
            clientes = resp_clientes.json().get('data', [])
        resp_produtos = requests.get(f"{PRODUTOS_SERVICE_URL}/produtos")
        if resp_produtos.status_code == 200:
            produtos = resp_produtos.json().get('data', [])
    except Exception as e:
        flash(f"Erro ao buscar dados: {e}", 'danger')

    # Buscar vendas para listar
    vendas = []
    try:
        resp_vendas = requests.get(f"{VENDAS_SERVICE_URL}/vendas")
        if resp_vendas.status_code == 200:
            vendas = resp_vendas.json().get('data', [])
    except Exception as e:
        flash(f"Erro ao buscar vendas: {e}", 'danger')

    return render_template('index.html', clientes=clientes, produtos=produtos, vendas=vendas)

@app.route('/vendas', methods=['POST'])
def realizar_venda():
    cliente_id = request.form.get('cliente_id')
    produto_ids = request.form.getlist('produto_id')
    quantidades = request.form.getlist('quantidade')

    if not cliente_id or not produto_ids or not quantidades:
        flash('Cliente, produtos e quantidades são obrigatórios', 'warning')
        return redirect(url_for('index'))

    produtos = []
    try:
        for pid, qnt in zip(produto_ids, quantidades):
            qnt_int = int(qnt)
            if qnt_int <= 0:
                continue
            produtos.append({'produto_id': int(pid), 'quantidade': qnt_int})
        
        if not produtos:
            flash('Informe pelo menos um produto com quantidade válida', 'warning')
            return redirect(url_for('index'))
    except ValueError:
        flash('Quantidade inválida', 'warning')
        return redirect(url_for('index'))

    payload = {
        'cliente_id': int(cliente_id),
        'produtos': produtos
    }

    try:
        resp = requests.post(f"{VENDAS_SERVICE_URL}/vendas", json=payload)
        if resp.status_code == 201:
            flash('Venda realizada com sucesso!', 'success')
        else:
            data = resp.json()
            flash(f"Erro ao realizar venda: {data.get('message', 'Erro desconhecido')}", 'danger')
    except Exception as e:
        flash(f"Erro ao conectar com o serviço de vendas: {e}", 'danger')

    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
