var GAS_URL = 'https://script.google.com/macros/s/AKfycbzjYR2mhbZBmrGUDCx3o9K3oesyiuxyS00ydwHtuf4J-n8K1rp8_c5rVKhNXTKIex8/exec';
var mesAtual = '';
var editandoId = null;
var alertCallback = null;

var _bridgeIframe = null;
var _bridgeReady = false;
var _bridgeInitPromise = null;
var _pendingCalls = {};
var _callId = 0;

function initBridge() {
  if (_bridgeReady) return Promise.resolve();
  if (_bridgeInitPromise) return _bridgeInitPromise;

  _bridgeInitPromise = new Promise(function(resolve, reject) {
    var url = GAS_URL;
    if (!url) {
      url = localStorage.getItem('gas_url');
      if (!url) {
        reject(new Error('URL do GAS nao configurada.'));
        return;
      }
      GAS_URL = url;
    }
    if (url.endsWith('/')) url = url.slice(0, -1);

    _bridgeIframe = document.createElement('iframe');
    _bridgeIframe.style.display = 'none';
    _bridgeIframe.src = url + '?bridge=1';
    document.body.appendChild(_bridgeIframe);

    var timeout = setTimeout(function() {
      reject(new Error('Timeout ao carregar bridge'));
    }, 20000);

    window.addEventListener('message', function handler(e) {
      if (e.data && e.data.ready === true) {
        _bridgeReady = true;
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve();
      }
      if (e.data && e.data.callId !== undefined) {
        var cb = _pendingCalls[e.data.callId];
        if (cb) {
          clearTimeout(cb.timeout);
          delete _pendingCalls[e.data.callId];
          if (e.data.error) cb.reject(new Error(e.data.error));
          else {
            var result = e.data.result;
            if (result && result.success === false) {
              cb.reject(new Error(result.message || 'Erro na operacao'));
            } else {
              cb.resolve(result);
            }
          }
        }
      }
    });
  });

  return _bridgeInitPromise;
}

function callAPI(action, params) {
  return new Promise(function(resolve, reject) {
    initBridge()
      .then(function() {
        var id = ++_callId;
        var timeout = setTimeout(function() {
          if (_pendingCalls[id]) {
            delete _pendingCalls[id];
            reject(new Error('Timeout - sem resposta do servidor'));
          }
        }, 30000);
        _pendingCalls[id] = { resolve: resolve, reject: reject, timeout: timeout };
        _bridgeIframe.contentWindow.postMessage({
          callId: id,
          action: action,
          params: params || {}
        }, '*');
      })
      .catch(function(err) {
        reject(err);
      });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loginPass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') fazerLogin();
  });
});

function mostrarLoading() {
  document.getElementById('loadingOverlay').classList.add('show');
}
function ocultarLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

function mostrarToast(mensagem, tipo) {
  tipo = tipo || 'info';
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast ' + tipo;
  toast.textContent = mensagem;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function confirmarAlert(titulo, mensagem, callback) {
  document.getElementById('alertTitle').textContent = titulo;
  document.getElementById('alertMessage').textContent = mensagem;
  alertCallback = callback;
  document.getElementById('alertOverlay').classList.add('show');
}

function fecharAlert(confirmado) {
  document.getElementById('alertOverlay').classList.remove('show');
  if (alertCallback) {
    alertCallback(confirmado);
    alertCallback = null;
  }
}

function toggleSenha() {
  var input = document.getElementById('loginPass');
  var btn = document.querySelector('.toggle-senha');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '\uD83D\uDE48';
  } else {
    input.type = 'password';
    btn.textContent = '\uD83D\uDC41';
  }
}

function fazerLogin() {
  var user = document.getElementById('loginUser').value.trim();
  var pass = document.getElementById('loginPass').value.trim();
  var errorDiv = document.getElementById('loginError');
  errorDiv.style.display = 'none';
  if (!user || !pass) {
    errorDiv.textContent = 'Preencha usuario e senha.';
    errorDiv.style.display = 'block';
    return;
  }
  mostrarLoading();
  callAPI('validarLogin', { usuario: user, senha: pass })
    .then(function(sucesso) {
      ocultarLoading();
      if (sucesso === true) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('userDisplay').textContent = user;
        inicializarSistema();
      } else {
        errorDiv.textContent = 'Usuario ou senha incorretos.';
        errorDiv.style.display = 'block';
      }
    })
    .catch(function(err) {
      ocultarLoading();
      errorDiv.textContent = 'Erro de conexao: ' + err.message;
      errorDiv.style.display = 'block';
    });
}

function fazerLogout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
}

function inicializarSistema() {
  callAPI('getMesAtual', {})
    .then(function(mes) {
      mesAtual = mes;
      carregarMes();
    })
    .catch(function(err) {
      mostrarToast('Erro ao carregar mes: ' + err.message, 'error');
    });
}

function navegarMes(direcao) {
  var parts = mesAtual.split('-');
  var ano = parseInt(parts[0]);
  var mes = parseInt(parts[1]) + direcao;
  if (mes < 1) { mes = 12; ano--; }
  if (mes > 12) { mes = 1; ano++; }
  mesAtual = ano + '-' + String(mes).padStart(2, '0');
  carregarMes();
}

function carregarMes() {
  mostrarLoading();
  callAPI('getResumo', { mesReferencia: mesAtual })
    .then(function(resumo) {
      ocultarLoading();
      atualizarInterface(resumo);
    })
    .catch(function(err) {
      ocultarLoading();
      mostrarToast('Erro ao carregar dados: ' + err.message, 'error');
    });
}

function atualizarInterface(resumo) {
  document.getElementById('monthDisplay').textContent = resumo.mesFormatado;
  document.getElementById('pagamentoLabel').textContent = 'Pagamento: ' + formatarMesAno(resumo.mesPagamento);
  document.getElementById('vencimentoInput').value = resumo.vencimento;

  var saldoAnt = resumo.saldoAnterior;
  var cardSaldo = document.getElementById('cardSaldoAnterior');
  var labelSaldo = document.getElementById('labelSaldoAnterior');
  var valueSaldo = document.getElementById('valueSaldoAnterior');

  if (saldoAnt > 0) {
    labelSaldo.textContent = 'Saldo do Mes Anterior';
    valueSaldo.className = 'value positive';
    cardSaldo.className = 'summary-card saldo-anterior-positivo';
  } else if (saldoAnt < 0) {
    labelSaldo.textContent = 'Debito do Mes Anterior';
    valueSaldo.className = 'value negative';
    cardSaldo.className = 'summary-card saldo-anterior-negativo';
  } else {
    labelSaldo.textContent = 'Saldo do Mes Anterior';
    valueSaldo.className = 'value default';
    cardSaldo.className = 'summary-card';
  }
  valueSaldo.textContent = formatarMoeda(saldoAnt);

  document.getElementById('valueDebitoAtual').textContent = formatarMoeda(resumo.totalDebitoAtual);
  document.getElementById('valueDebitoGeral').textContent = formatarMoeda(resumo.totalDebitoGeral);
  document.getElementById('valueTotalPago').textContent = formatarMoeda(resumo.totalValorPago);
  document.getElementById('valueSaldoPendente').textContent = formatarMoeda(resumo.saldoPendente);

  renderizarTabela(resumo.parcelas, resumo.avulsos);
}

function renderizarTabela(parcelas, avulsos) {
  var tbody = document.getElementById('tabelaParcelas');
  tbody.innerHTML = '';
  var total = (parcelas ? parcelas.length : 0) + (avulsos ? avulsos.length : 0);
  document.getElementById('totalRegistros').textContent = total + ' registro(s)';

  if (total === 0) {
    tbody.innerHTML = '<tr class="vazio-row"><td colspan="8">Nenhum registro para este mes.</td></tr>';
    return;
  }

  if (parcelas) {
    for (var i = 0; i < parcelas.length; i++) {
      var p = parcelas[i];
      var tr = document.createElement('tr');
      tr.className = p.pago ? 'pago-true' : '';
      tr.dataset.idParcela = p.id;
      tr.dataset.idCompra = p.idCompra;

      tr.innerHTML =
        '<td>' + p.dataCompra + '</td>' +
        '<td><strong>' + escHtml(p.descricao) + '</strong></td>' +
        '<td><span class="parcela-badge">' + p.parcelaAtual + '/' + p.totalParcelas + '</span></td>' +
        '<td><strong>' + formatarMoeda(p.valorParcela) + '</strong></td>' +
        '<td style="text-align:center;">' +
          '<input type="checkbox" class="checkbox-pago" ' + (p.pago ? 'checked' : '') + ' onchange="togglePago(this, \'' + p.id + '\', ' + p.valorParcela + ')">' +
        '</td>' +
        '<td>' +
          '<div class="td-valor-pago">' +
            '<input type="number" step="0.01" id="vp_' + p.id + '" value="' + (p.pago ? p.valorPago : '') + '" readonly onchange="salvarValorPago(\'' + p.id + '\')">' +
            '<button class="btn btn-xs btn-outline" onclick="alterarValorPago(\'' + p.id + '\')" style="margin-top:4px;width:100%;">Alterar Valor</button>' +
          '</div>' +
        '</td>' +
        '<td class="td-data-pagamento">' +
          '<input type="date" id="dp_' + p.id + '" value="' + p.dataPagamento + '" ' + (p.pago ? '' : 'disabled') + ' onchange="salvarDataPagamento(\'' + p.id + '\')">' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div class="td-actions">' +
            '<button class="btn btn-sm btn-warning" onclick="editarCompra(\'' + p.idCompra + '\')">Editar</button>' +
            '<button class="btn btn-sm btn-danger" onclick="excluirCompra(\'' + p.idCompra + '\')">Excluir</button>' +
          '</div>' +
        '</td>';

      tbody.appendChild(tr);
    }
  }

  if (avulsos) {
    for (var j = 0; j < avulsos.length; j++) {
      var a = avulsos[j];
      var trA = document.createElement('tr');
      trA.className = 'pago-true';
      trA.innerHTML =
        '<td>' + (a.dataPagamento || '---') + '</td>' +
        '<td><strong>' + escHtml(a.descricao) + '</strong> <em style="color:#64748b;font-size:12px;">(Avulso)</em></td>' +
        '<td><span class="parcela-badge">Avulso</span></td>' +
        '<td><strong>' + formatarMoeda(a.valor) + '</strong></td>' +
        '<td style="text-align:center;">&#10003;</td>' +
        '<td><strong>' + formatarMoeda(a.valor) + '</strong></td>' +
        '<td>' + (a.dataPagamento || '---') + '</td>' +
        '<td style="text-align:center;">' +
          '<button class="btn btn-sm btn-danger" onclick="excluirAvulso(\'' + a.id + '\')">Excluir</button>' +
        '</td>';
      tbody.appendChild(trA);
    }
  }
}

function togglePago(checkbox, idParcela, valorParcela) {
  var pago = checkbox.checked;
  var vpInput = document.getElementById('vp_' + idParcela);
  var dpInput = document.getElementById('dp_' + idParcela);

  if (pago) {
    vpInput.value = valorParcela.toFixed(2);
    vpInput.readOnly = false;
    dpInput.disabled = false;
    if (!dpInput.value) {
      var hoje = new Date();
      dpInput.value = hoje.toISOString().split('T')[0];
    }
  } else {
    vpInput.value = '';
    vpInput.readOnly = true;
    dpInput.disabled = true;
    dpInput.value = '';
  }

  salvarParcela(idParcela, pago, vpInput.value, dpInput.value);
}

function alterarValorPago(idParcela) {
  var input = document.getElementById('vp_' + idParcela);
  input.readOnly = !input.readOnly;
  if (!input.readOnly) {
    input.focus();
    input.select();
  }
}

function salvarValorPago(idParcela) {
  var vpInput = document.getElementById('vp_' + idParcela);
  var dpInput = document.getElementById('dp_' + idParcela);
  var checkbox = document.querySelector('tr[data-id-parcela="' + idParcela + '"] .checkbox-pago');
  var pago = checkbox ? checkbox.checked : false;
  if (pago) {
    salvarParcela(idParcela, true, vpInput.value, dpInput.value);
  }
}

function salvarDataPagamento(idParcela) {
  var vpInput = document.getElementById('vp_' + idParcela);
  var dpInput = document.getElementById('dp_' + idParcela);
  var checkbox = document.querySelector('tr[data-id-parcela="' + idParcela + '"] .checkbox-pago');
  var pago = checkbox ? checkbox.checked : false;
  if (pago) {
    salvarParcela(idParcela, true, vpInput.value, dpInput.value);
  }
}

function salvarParcela(id, pago, valorPago, dataPagamento) {
  mostrarLoading();
  callAPI('updateParcela', {
    id: id,
    pago: pago,
    valorPago: parseFloat(valorPago) || 0,
    dataPagamento: dataPagamento
  })
    .then(function(result) {
      ocultarLoading();
      if (result.success) {
        mostrarToast(result.message, 'success');
        carregarMes();
      } else {
        mostrarToast(result.message, 'error');
      }
    })
    .catch(function(err) {
      ocultarLoading();
      mostrarToast('Erro: ' + err.message, 'error');
    });
}

function salvarVencimento() {
  var dia = document.getElementById('vencimentoInput').value;
  if (dia < 1 || dia > 31) {
    mostrarToast('Dia de vencimento invalido.', 'error');
    return;
  }
  callAPI('setConfig', { chave: 'vencimento', valor: String(dia) })
    .then(function() {
      mostrarToast('Vencimento salvo!', 'success');
    })
    .catch(function(err) {
      mostrarToast('Erro: ' + err.message, 'error');
    });
}

function calcularValorParcela() {
  var total = parseFloat(document.getElementById('inputValorTotal').value) || 0;
  var parcelas = parseInt(document.getElementById('inputParcelas').value) || 1;
  if (parcelas > 0) {
    document.getElementById('inputValorParcela').value = (total / parcelas).toFixed(2);
  }
}

function salvarCompra() {
  var data = document.getElementById('inputData').value;
  var desc = document.getElementById('inputDesc').value.trim();
  var valorTotal = parseFloat(document.getElementById('inputValorTotal').value) || 0;
  var totalParcelas = parseInt(document.getElementById('inputParcelas').value) || 1;
  var valorParcela = parseFloat(document.getElementById('inputValorParcela').value) || 0;

  if (!data) { mostrarToast('Informe a data da compra.', 'error'); return; }
  if (!desc) { mostrarToast('Informe a descricao.', 'error'); return; }
  if (valorTotal <= 0) { mostrarToast('Informe o valor total.', 'error'); return; }
  if (totalParcelas < 1) { mostrarToast('Informe o total de parcelas.', 'error'); return; }
  if (valorParcela <= 0) { mostrarToast('Informe o valor das parcelas.', 'error'); return; }

  mostrarLoading();

  var editId = document.getElementById('editId').value;

  var promise;
  if (editId) {
    promise = callAPI('editCompra', {
      idCompra: editId,
      dataCompra: data,
      descricao: desc,
      valorTotal: valorTotal,
      totalParcelas: totalParcelas,
      valorParcelas: valorParcela
    });
  } else {
    promise = callAPI('addCompra', {
      dataCompra: data,
      descricao: desc,
      valorTotal: valorTotal,
      totalParcelas: totalParcelas,
      valorParcelas: valorParcela
    });
  }

  promise
    .then(function(result) {
      ocultarLoading();
      if (result.success) {
        mostrarToast(result.message, 'success');
        if (!editId) {
          document.getElementById('inputData').value = '';
          document.getElementById('inputDesc').value = '';
          document.getElementById('inputValorTotal').value = '';
          document.getElementById('inputParcelas').value = '1';
          document.getElementById('inputValorParcela').value = '';
        } else {
          cancelarEdicao();
        }
        carregarMes();
      } else {
        mostrarToast(result.message, 'error');
      }
    })
    .catch(function(err) {
      ocultarLoading();
      mostrarToast('Erro: ' + err.message, 'error');
    });
}

function editarCompra(idCompra) {
  confirmarAlert('Editar Registro', 'Deseja realmente editar este registro?', function(confirmado) {
    if (confirmado) {
      mostrarLoading();
      callAPI('getCompra', { idCompra: idCompra })
        .then(function(compra) {
          ocultarLoading();
          if (compra) {
            document.getElementById('editId').value = compra.id;
            document.getElementById('inputData').value = compra.dataCompra;
            document.getElementById('inputDesc').value = compra.descricao;
            document.getElementById('inputValorTotal').value = compra.valorTotal;
            document.getElementById('inputParcelas').value = compra.totalParcelas;
            document.getElementById('inputValorParcela').value = (compra.valorTotal / compra.totalParcelas).toFixed(2);
            document.getElementById('formTitle').textContent = 'Editando: ' + compra.descricao;
            document.getElementById('btnSalvar').textContent = 'Salvar Alteracoes';
            document.getElementById('btnCancelar').style.display = 'block';
            document.getElementById('inputData').focus();
          } else {
            mostrarToast('Compra nao encontrada.', 'error');
          }
        })
        .catch(function(err) {
          ocultarLoading();
          mostrarToast('Erro: ' + err.message, 'error');
        });
    }
  });
}

function cancelarEdicao() {
  document.getElementById('editId').value = '';
  document.getElementById('inputData').value = '';
  document.getElementById('inputDesc').value = '';
  document.getElementById('inputValorTotal').value = '';
  document.getElementById('inputParcelas').value = '1';
  document.getElementById('inputValorParcela').value = '';
  document.getElementById('formTitle').textContent = 'Nova Compra / Emprestimo';
  document.getElementById('btnSalvar').textContent = 'Registrar';
  document.getElementById('btnCancelar').style.display = 'none';
}

function excluirCompra(idCompra) {
  confirmarAlert('Excluir Registro', 'Deseja realmente excluir este registro? Todas as parcelas serao removidas.', function(confirmado) {
    if (confirmado) {
      mostrarLoading();
      callAPI('deleteCompra', { idCompra: idCompra })
        .then(function(result) {
          ocultarLoading();
          if (result.success) {
            mostrarToast(result.message, 'success');
            carregarMes();
            cancelarEdicao();
          } else {
            mostrarToast(result.message, 'error');
          }
        })
        .catch(function(err) {
          ocultarLoading();
          mostrarToast('Erro: ' + err.message, 'error');
        });
    }
  });
}

function excluirAvulso(id) {
  confirmarAlert('Excluir Avulso', 'Deseja realmente excluir este valor avulso?', function(confirmado) {
    if (confirmado) {
      mostrarLoading();
      callAPI('deleteAvulso', { id: id })
        .then(function(result) {
          ocultarLoading();
          if (result.success) {
            mostrarToast(result.message, 'success');
            carregarMes();
          } else {
            mostrarToast(result.message, 'error');
          }
        })
        .catch(function(err) {
          ocultarLoading();
          mostrarToast('Erro: ' + err.message, 'error');
        });
    }
  });
}

function toggleAvulso() {
  var body = document.getElementById('avulsoBody');
  var toggle = document.getElementById('avulsoToggle');
  body.classList.toggle('open');
  toggle.classList.toggle('open');
}

function registrarAvulso() {
  var valor = parseFloat(document.getElementById('avulsoValor').value);
  var data = document.getElementById('avulsoData').value;
  var desc = document.getElementById('avulsoDesc').value.trim() || 'Valor Avulso';

  if (!valor || valor <= 0) { mostrarToast('Informe o valor avulso.', 'error'); return; }
  if (!data) { mostrarToast('Informe a data de pagamento.', 'error'); return; }

  mostrarLoading();
  callAPI('addAvulso', { mesReferencia: mesAtual, valor: valor, dataPagamento: data, descricao: desc })
    .then(function(result) {
      ocultarLoading();
      if (result.success) {
        mostrarToast(result.message, 'success');
        document.getElementById('avulsoValor').value = '';
        document.getElementById('avulsoData').value = '';
        document.getElementById('avulsoDesc').value = '';
        carregarMes();
      } else {
        mostrarToast(result.message, 'error');
      }
    })
    .catch(function(err) {
      ocultarLoading();
      mostrarToast('Erro: ' + err.message, 'error');
    });
}

function formatarMoeda(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

function formatarMesAno(mesRef) {
  if (!mesRef) return '---';
  var partes = mesRef.split('-');
  var mes = parseInt(partes[1]);
  var ano = partes[0];
  var meses = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes - 1] + ' de ' + ano;
}

function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.onclick = function(event) {
  if (event.target === document.getElementById('alertOverlay')) {
    fecharAlert(false);
  }
};
