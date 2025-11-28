const API_URL = '/api/pessoas';

const tabelaBody = document.querySelector('#tabelaPessoas tbody');
const searchInput = document.getElementById('searchInput');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('formPessoa');
const inputId = document.getElementById('pessoaId');
const inputNome = document.getElementById('nome');
const inputCpf = document.getElementById('cpf');
const inputIdade = document.getElementById('idade');
const btnSalvar = document.getElementById('btnSalvar');

const modalConfirm = document.getElementById('modal-confirm');
const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
const btnCancelarExclusao = document.getElementById('btnCancelarExclusao');
let idParaDeletar = null;
let todasAsPessoas = [];

const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

document.addEventListener('DOMContentLoaded', () => {
    listarPessoas();
});

hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

async function listarPessoas() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Erro ao buscar dados da API');
        const data = await res.json();
        todasAsPessoas = data;
        renderizarTabela(data);
    } catch (error) {
        console.error('Erro ao listar:', error);
        showToast('Falha ao carregar pessoas.', 'error');
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = inputId.value;
    const pessoa = {
        nome: inputNome.value,
        cpf: inputCpf.value,
        idade: inputIdade.value
    };

    const method = id ? 'PUT' : 'POST';
    const body = id ? { ...pessoa, id } : pessoa;

    try {
        const res = await fetch(API_URL, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const json = await res.json();

        if (!res.ok) {
            showToast(json.message || 'Erro ao salvar.', 'error');
            return;
        }

        showToast(json.message || 'Operação bem-sucedida!', 'success');
        closeModal();
        listarPessoas();

    } catch (error) {
        console.error("Erro na requisição:", error);
        showToast('Erro de conexão ao salvar.', 'error');
    }
});

async function deletarPessoa(id) {
    try {
        const res = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE'
        });
        
        const json = await res.json();

        if (!res.ok) {
            showToast(json.message || 'Erro ao excluir.', 'error');
            return;
        }

        showToast(json.message || 'Pessoa excluída.', 'success');
        listarPessoas();

    } catch (error) {
        console.error("Erro ao deletar:", error);
        showToast('Erro de conexão ao excluir.', 'error');
    }
}

function renderizarTabela(pessoas) {
    tabelaBody.innerHTML = '';

    if (pessoas.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #9ca3af;">Nenhum registro encontrado.</td></tr>';
        return;
    }

    pessoas.forEach(pessoa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted);">#${pessoa.id}</td>
            <td style="font-weight: 500;">${pessoa.nome}</td>
            <td>${pessoa.cpf}</td>
            <td>${pessoa.idade}</td>
            <td style="text-align: right;">
                <button class="btn-icon text-primary" onclick="prepararEdicao(${pessoa.id}, '${pessoa.nome}', '${pessoa.cpf}', ${pessoa.idade})">
                    <i class="ph ph-pencil-simple"></i>
                </button>
                <button class="btn-icon text-danger" onclick="abrirModalDelete(${pessoa.id})">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        `;
        tabelaBody.appendChild(tr);
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');

    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

window.openModal = () => {
    modalOverlay.classList.add('open');
};

window.abrirModalCadastro = () => {
    limparFormulario();
    openModal();
};

window.closeModal = () => {
    modalOverlay.classList.remove('open');
};

window.abrirModalDelete = (id) => {
    idParaDeletar = id;
    modalConfirm.style.display = "flex";
};

btnConfirmarExclusao.addEventListener('click', () => {
    if (idParaDeletar) {
        deletarPessoa(idParaDeletar);
        modalConfirm.style.display = 'none';
        idParaDeletar = null;
    }
});

btnCancelarExclusao.addEventListener('click', () => {
    modalConfirm.style.display = 'none';
    idParaDeletar = null;
});

window.prepararEdicao = (id, nome, cpf, idade) => {
    modalTitle.textContent = 'Editar Pessoa';
    inputId.value = id;
    inputNome.value = nome;
    inputCpf.value = cpf;
    inputIdade.value = idade;
    btnSalvar.textContent = 'Atualizar';
    openModal();
};

function limparFormulario() {
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Cadastrar Pessoa';
    btnSalvar.textContent = 'Salvar';
}

inputCpf.addEventListener('input', (e) => maskCPF(e.target));

function maskCPF(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    input.value = value;
}

searchInput.addEventListener('keyup', () => {
    const termo = searchInput.value.toLowerCase();
    const pessoasFiltradas = todasAsPessoas.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        p.cpf.includes(termo)
    );
    renderizarTabela(pessoasFiltradas);
});