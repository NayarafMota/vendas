from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import requests
import os
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configuração de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# URLs dos outros microserviços
PRODUTOS_SERVICE_URL = os.getenv('PRODUTOS_SERVICE_URL', 'http://localhost:3001')
CLIENTES_SERVICE_URL = os.getenv('CLIENTES_SERVICE_URL', 'http://localhost:3002')

# Configurações do banco de dados
db_config = {
    'user': 'root',
    'password': 'root',
    'host': os.getenv('DB_HOST', 'db'),
    'database': 'vendasdb',
    'port': 3306
}

# --- funções auxiliares ---
def buscar_cliente(cliente_id):
    try:
        response = requests.get(f'{CLIENTES_SERVICE_URL}/clientes/{cliente_id}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get('data') if data.get('success') else None
        return None
    except requests.RequestException as e:
        logger.error(f"Erro ao buscar cliente {cliente_id}: {str(e)}")
        return None

def buscar_produto(produto_id):
    try:
        response = requests.get(f'{PRODUTOS_SERVICE_URL}/produtos/{produto_id}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get('data') if data.get('success') else None
        return None
    except requests.RequestException as e:
        logger.error(f"Erro ao buscar produto {produto_id}: {str(e)}")
        return None

def validar_venda(cliente_id, produtos):
    cliente = buscar_cliente(cliente_id)
    if not cliente:
        raise ValueError('Cliente não encontrado')

    produtos_validados = []
    valor_total = 0

    for item in produtos:
        produto_id = item.get('produto_id')
        quantidade = item.get('quantidade', 0)

        produto = buscar_produto(produto_id)
        if not produto:
            raise ValueError(f'Produto ID {produto_id} não encontrado')

        if quantidade <= 0:
            raise ValueError('Quantidade deve ser maior que zero')

        produto_validado = {
            'produto_id': produto['id'],
            'nome_produto': produto['nome'],
            'quantidade': int(quantidade),
            'valor_unitario': produto['valor'],
            'valor_total': produto['valor'] * int(quantidade)
        }

        produtos_validados.append(produto_validado)
        valor_total += produto_validado['valor_total']

    return {
        'cliente': cliente,
        'produtos': produtos_validados,
        'valor_total': valor_total
    }

# --- rotas ---
@app.route('/health', methods=['GET'])
def health_check():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM vendas")
        total = cursor.fetchone()[0]
        conn.close()

        return jsonify({
            'status': 'OK',
            'service': 'Vendas',
            'version': '2.0.0',
            'timestamp': datetime.now().isoformat(),
            'total_vendas': total
        })
    except Exception as e:
        logger.error(f"Erro no health check: {str(e)}")
        return jsonify({'status': 'ERROR', 'message': 'Erro ao conectar ao banco'}), 500

@app.route('/vendas', methods=['GET'])
def listar_vendas():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vendas ORDER BY id DESC")
        vendas_raw = cursor.fetchall()
        conn.close()

        vendas_enriquecidas = []
        for venda in vendas_raw:
            cliente = buscar_cliente(venda['cliente_id'])
            venda['cliente'] = {
                'id': cliente['id'],
                'nome': cliente['nome']
            } if cliente else None
            vendas_enriquecidas.append(venda)

        return jsonify({
            'success': True,
            'data': vendas_enriquecidas,
            'total': len(vendas_enriquecidas)
        })

    except Exception as e:
        logger.error(f"Erro ao listar vendas: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

@app.route('/vendas', methods=['POST'])
def criar_venda():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados não fornecidos'}), 400

        cliente_id = data.get('cliente_id')
        produtos = data.get('produtos', [])

        if not cliente_id or not produtos:
            return jsonify({'success': False, 'message': 'Cliente e produtos são obrigatórios'}), 400

        dados_validados = validar_venda(cliente_id, produtos)

        # Inserir venda no banco
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO vendas (cliente_id, valor_total, data_venda, status) VALUES (%s, %s, %s, %s)",
            (cliente_id, dados_validados['valor_total'], datetime.now(), 'concluida')
        )
        venda_id = cursor.lastrowid

    
        conn.commit()
        conn.close()

        nova_venda = {
            'id': venda_id,
            'cliente_id': cliente_id,
            'produtos': dados_validados['produtos'],
            'valor_total': dados_validados['valor_total'],
            'data_venda': datetime.now().isoformat(),
            'status': 'concluida',
            'cliente': dados_validados['cliente']
        }

        return jsonify({
            'success': True,
            'message': 'Venda criada com sucesso',
            'data': nova_venda
        }), 201

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Erro ao criar venda: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

@app.route('/vendas/<int:venda_id>', methods=['GET'])
def buscar_venda(venda_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vendas WHERE id = %s", (venda_id,))
        venda = cursor.fetchone()
        conn.close()

        if not venda:
            return jsonify({'success': False, 'message': 'Venda não encontrada'}), 404

        cliente = buscar_cliente(venda['cliente_id'])
        venda['cliente'] = cliente

        return jsonify({'success': True, 'data': venda})
    except Exception as e:
        logger.error(f"Erro ao buscar venda {venda_id}: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3003))
    print(f"💰 Microserviço de Vendas (Python Flask) rodando na porta {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
