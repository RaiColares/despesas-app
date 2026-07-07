/**
 * SISTEMA DE REGISTRO DE DESPESAS
 * Google Apps Script - REST API Backend
 *
 * Publique como aplicativo web (Executar como: "Eu", Acesso: "Qualquer pessoa")
 * 1. Copie este arquivo para o editor do GAS
 * 2. Publique como aplicativo web
 * 3. Visite a URL gerada + "?action=setup" para configurar as credenciais
 * 4. Configure a GAS_URL no frontend (public/js/app.js)
 */

function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.bridge === '1') {
      return HtmlService.createHtmlOutput(getBridgeHtml())
        .setTitle('')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if (e.parameter.action === 'setup') {
      return HtmlService.createHtmlOutput(getSetupHtml())
        .setTitle('Configurar Credenciais')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'online', app: 'Registro de Despesas' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getBridgeHtml() {
  return '<!DOCTYPE html><html><head><base target="_top"><meta charset="UTF-8"></head><body><script>' +
    '(function(){' +
    'var ready=false;' +
    'window.addEventListener("message",function(e){' +
    'var msg=e.data;' +
    'if(!msg||msg.action===undefined)return;' +
    'if(!ready)return;' +
    'var callId=msg.callId;' +
    'var params=msg.params||{};' +
    'function respond(result,error){' +
    'try{e.source.postMessage({callId:callId,result:result,error:error?(error.message||String(error)):null},e.origin||"*");}catch(e){}}' +
    'var runner=google.script.run.withSuccessHandler(respond).withFailureHandler(function(err){respond(null,err);});' +
    'switch(msg.action){' +
    'case"validarLogin":runner.validarLogin(params.usuario,params.senha);break;' +
    'case"getMesAtual":runner.getMesAtual();break;' +
    'case"getResumo":runner.getResumo(params.mesReferencia);break;' +
    'case"getCompra":runner.getCompra(params.idCompra);break;' +
    'case"addCompra":runner.addCompra(params.dataCompra,params.descricao,params.valorTotal,params.totalParcelas,params.valorParcelas);break;' +
    'case"editCompra":runner.editCompra(params.idCompra,params.dataCompra,params.descricao,params.valorTotal,params.totalParcelas,params.valorParcelas);break;' +
    'case"deleteCompra":runner.deleteCompra(params.idCompra);break;' +
    'case"updateParcela":runner.updateParcela(params.id,params.pago===true||params.pago==="true",Number(params.valorPago),params.dataPagamento);break;' +
    'case"addAvulso":runner.addAvulso(params.mesReferencia,Number(params.valor),params.dataPagamento,params.descricao);break;' +
    'case"deleteAvulso":runner.deleteAvulso(params.id);break;' +
    'case"setConfig":runner.setConfig(params.chave,params.valor);break;' +
    '}' +
    '});' +
    '(top||parent).postMessage({ready:true},"*");' +
    'ready=true;' +
    '})();' +
    '<\/script><\/body><\/html>';
}

function getSetupHtml() {
  return '<!DOCTYPE html><html><head><base target="_top"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Configurar Credenciais</title>' +
    '<style>' +
    'body{font-family:system-ui,-apple-system,sans-serif;max-width:420px;margin:60px auto;padding:24px;background:#f0f2f5;}' +
    '.card{background:white;border-radius:20px;padding:40px;box-shadow:0 10px 40px rgba(0,0,0,0.1);}' +
    'h1{font-size:24px;margin:0 0 4px;}' +
    'p{color:#64748b;margin:0 0 24px;font-size:14px;}' +
    'label{display:block;font-size:13px;font-weight:600;color:#475569;margin-bottom:4px;}' +
    'input{width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;font-size:15px;box-sizing:border-box;margin-bottom:16px;}' +
    'input:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 4px rgba(79,70,229,0.1);}' +
    'button{width:100%;padding:12px 24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(79,70,229,0.3);}' +
    'button:hover{transform:translateY(-1px);}' +
    '.msg{padding:12px 16px;border-radius:10px;font-size:14px;margin-bottom:16px;display:none;}' +
    '.msg.success{background:#f0fdf4;color:#059669;border:1px solid #86efac;display:block;}' +
    '.msg.error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;display:block;}' +
    '</style>' +
    '</head><body>' +
    '<div class="card">' +
    '<h1>Configurar Credenciais</h1>' +
    '<p>Defina o usuario e senha para acessar o sistema de despesas.</p>' +
    '<div class="msg" id="msg"></div>' +
    '<form id="setupForm" onsubmit="salvar(event)">' +
    '<label for="usuario">Usuario</label>' +
    '<input type="text" id="usuario" value="Aline" required>' +
    '<label for="senha">Senha</label>' +
    '<input type="password" id="senha" required>' +
    '<button type="submit">Salvar Credenciais</button>' +
    '</form>' +
    '<div id="done" style="display:none;text-align:center;">' +
    '<p style="color:#059669;font-weight:600;margin-bottom:8px;">Configurado com sucesso!</p>' +
    '<p style="font-size:13px;">Agora voce pode fechar esta pagina e acessar o sistema pelo frontend.</p>' +
    '</div>' +
    '</div>' +
    '<script>' +
    'function salvar(e){' +
    'e.preventDefault();' +
    'var msg=document.getElementById("msg");' +
    'msg.className="msg";msg.textContent="";' +
    'google.script.run' +
    '.withSuccessHandler(function(r){' +
    'msg.className="msg success";' +
    'msg.textContent=r.message||"Credenciais salvas!";' +
    'document.getElementById("setupForm").style.display="none";' +
    'document.getElementById("done").style.display="block";' +
    '})' +
    '.withFailureHandler(function(err){' +
    'msg.className="msg error";' +
    'msg.textContent=err.message||"Erro ao salvar credenciais";' +
    '})' +
    '.doSetup(document.getElementById("usuario").value,document.getElementById("senha").value);' +
    '}' +
    '<\/script>' +
    '</body></html>';
}

function doSetup(usuario, senha) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('usuario', usuario);
  props.setProperty('senha', senha);
  return { success: true, message: 'Credenciais configuradas com sucesso!' };
}

function doPost(e) {
  var action = e.parameter.action;
  var params = {};

  try {
    params = JSON.parse(e.parameter.payload || '{}');
  } catch (err) {
    params = {};
  }

  var result;

  try {
    switch (action) {
      case 'validarLogin':
        result = validarLogin(params.usuario, params.senha);
        break;
      case 'getMesAtual':
        result = getMesAtual();
        break;
      case 'getResumo':
        result = getResumo(params.mesReferencia);
        break;
      case 'getCompra':
        result = getCompra(params.idCompra);
        break;
      case 'addCompra':
        result = addCompra(params.dataCompra, params.descricao, params.valorTotal, params.totalParcelas, params.valorParcelas);
        break;
      case 'editCompra':
        result = editCompra(params.idCompra, params.dataCompra, params.descricao, params.valorTotal, params.totalParcelas, params.valorParcelas);
        break;
      case 'deleteCompra':
        result = deleteCompra(params.idCompra);
        break;
      case 'updateParcela':
        result = updateParcela(params.id, params.pago === true || params.pago === 'true', Number(params.valorPago), params.dataPagamento);
        break;
      case 'addAvulso':
        result = addAvulso(params.mesReferencia, Number(params.valor), params.dataPagamento, params.descricao);
        break;
      case 'deleteAvulso':
        result = deleteAvulso(params.id);
        break;
      case 'setConfig':
        result = setConfig(params.chave, params.valor);
        break;
      case 'setup':
        result = doSetup(params.usuario, params.senha);
        break;
      default:
        result = { success: false, message: 'Acao desconhecida: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message || 'Erro interno' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function inicializarPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Planilha nao encontrada. Vincule o script a uma planilha ou use openById().');
  }

  var sheets = {
    Config: ['Chave', 'Valor'],
    Compras: ['ID', 'Descricao', 'ValorTotal', 'TotalParcelas', 'DataCompra', 'Ativa'],
    Parcelas: ['ID', 'IDCompra', 'Descricao', 'ParcelaAtual', 'TotalParcelas', 'ValorParcela', 'MesReferencia', 'MesPagamento', 'DataVencimento', 'Pago', 'ValorPago', 'DataPagamento', 'DataCompra'],
    Avulsos: ['ID', 'MesReferencia', 'Valor', 'DataPagamento', 'Descricao'],
    MesesFinalizados: ['MesReferencia']
  };

  for (var nome in sheets) {
    var sheet = ss.getSheetByName(nome);
    if (!sheet) {
      sheet = ss.insertSheet(nome);
    }
    var headers = sheets[nome];
    var existingData = sheet.getDataRange().getValues();
    if (existingData.length === 0 || (existingData.length === 1 && existingData[0].join('') === '')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }

  var configSheet = ss.getSheetByName('Config');
  var configData = configSheet.getDataRange().getValues();
  var defaults = {
    vencimento: '10'
  };
  for (var chave in defaults) {
    var found = false;
    for (var i = 0; i < configData.length; i++) {
      if (configData[i][0] === chave) {
        found = true;
        break;
      }
    }
    if (!found) {
      configSheet.appendRow([chave, defaults[chave]]);
    }
  }

  return true;
}

function getConfig(chave) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Config');
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === chave) return data[i][1];
  }
  return null;
}

function setConfig(chave, valor) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Config');
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === chave) {
      sheet.getRange(i + 1, 2).setValue(valor);
      return { success: true };
    }
  }
  sheet.appendRow([chave, valor]);
  return { success: true };
}

function validarLogin(usuario, senha) {
  var props = PropertiesService.getScriptProperties();
  var userSalvo = props.getProperty('usuario');
  var senhaSalva = props.getProperty('senha');

  if (!userSalvo || !senhaSalva) {
    inicializarPlanilha();
    userSalvo = getConfig('usuario');
    senhaSalva = getConfig('senha');
  }

  return (usuario === userSalvo && senha === senhaSalva);
}

function gerarId() {
  return 'C' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

function gerarIdAvulso() {
  return 'A' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

function obterProximoMes(mesRef) {
  var parts = mesRef.split('-');
  var ano = parseInt(parts[0]);
  var mes = parseInt(parts[1]);
  mes++;
  if (mes > 12) { mes = 1; ano++; }
  return ano + '-' + String(mes).padStart(2, '0');
}

function obterMesAnterior(mesRef) {
  var parts = mesRef.split('-');
  var ano = parseInt(parts[0]);
  var mes = parseInt(parts[1]);
  mes--;
  if (mes < 1) { mes = 12; ano--; }
  return ano + '-' + String(mes).padStart(2, '0');
}

function formatarMesAno(mesRef) {
  var partes = mesRef.split('-');
  var mes = parseInt(partes[1]);
  var ano = partes[0];
  var meses = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes - 1] + ' de ' + ano;
}

function addCompra(dataCompra, descricao, valorTotal, totalParcelas, valorParcelas) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var id = gerarId();
  var sheetCompras = ss.getSheetByName('Compras');
  sheetCompras.appendRow([id, descricao, valorTotal, totalParcelas, dataCompra, 'SIM']);

  var dataParts = dataCompra.split('-');
  var mesCompra = parseInt(dataParts[1]);
  var anoCompra = parseInt(dataParts[0]);
  var sheetParcelas = ss.getSheetByName('Parcelas');
  var vencimento = getConfig('vencimento') || '10';

  for (var i = 1; i <= totalParcelas; i++) {
    var mesRef = mesCompra + i;
    var anoRef = anoCompra;
    while (mesRef > 12) { mesRef -= 12; anoRef++; }

    var mesPgt = mesRef + 1;
    var anoPgt = anoRef;
    while (mesPgt > 12) { mesPgt -= 12; anoPgt++; }

    var mesRefStr = anoRef + '-' + String(mesRef).padStart(2, '0');
    var mesPgtStr = anoPgt + '-' + String(mesPgt).padStart(2, '0');
    var idParcela = id + '_' + i;
    var dataVenc = mesPgtStr + '-' + String(vencimento).padStart(2, '0');

    sheetParcelas.appendRow([
      idParcela, id, descricao, i, totalParcelas,
      valorParcelas, mesRefStr, mesPgtStr, dataVenc,
      'NAO', 0, '', dataCompra
    ]);
  }

  return { success: true, message: 'Compra registrada com sucesso!' };
}

function addAvulso(mesReferencia, valor, dataPagamento, descricao) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Avulsos');
  var id = gerarIdAvulso();
  sheet.appendRow([id, mesReferencia, valor, dataPagamento, descricao || 'Valor Avulso']);
  return { success: true, message: 'Valor avulso registrado!' };
}

function getAvulsos(mesReferencia) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Avulsos');
  var data = sheet.getDataRange().getValues();
  var avulsos = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === mesReferencia) {
      avulsos.push({
        id: data[i][0],
        mesReferencia: data[i][1],
        valor: Number(data[i][2]),
        dataPagamento: data[i][3] ? String(data[i][3]) : '',
        descricao: String(data[i][4] || 'Valor Avulso')
      });
    }
  }
  return avulsos;
}

function getParcelas(mesReferencia) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Parcelas');
  var data = sheet.getDataRange().getValues();
  var parcelas = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][6]) === mesReferencia) {
      parcelas.push({
        id: String(data[i][0]),
        idCompra: String(data[i][1]),
        descricao: String(data[i][2]),
        parcelaAtual: Number(data[i][3]),
        totalParcelas: Number(data[i][4]),
        valorParcela: Number(data[i][5]),
        mesReferencia: String(data[i][6]),
        mesPagamento: String(data[i][7]),
        dataVencimento: String(data[i][8]),
        pago: String(data[i][9]) === 'SIM',
        valorPago: Number(data[i][10]),
        dataPagamento: String(data[i][11]),
        dataCompra: String(data[i][12])
      });
    }
  }
  return parcelas;
}

function updateParcela(id, pago, valorPago, dataPagamento) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Parcelas');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.getRange(i + 1, 10).setValue(pago ? 'SIM' : 'NAO');
      sheet.getRange(i + 1, 11).setValue(pago ? valorPago : 0);
      sheet.getRange(i + 1, 12).setValue(pago ? dataPagamento : '');
      return { success: true, message: 'Parcela atualizada!' };
    }
  }
  return { success: false, message: 'Parcela nao encontrada.' };
}

function editCompra(idCompra, dataCompra, descricao, valorTotal, totalParcelas, valorParcelas) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetCompras = ss.getSheetByName('Compras');
  var compraData = sheetCompras.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < compraData.length; i++) {
    if (String(compraData[i][0]) === idCompra) {
      sheetCompras.getRange(i + 1, 2).setValue(descricao);
      sheetCompras.getRange(i + 1, 3).setValue(valorTotal);
      sheetCompras.getRange(i + 1, 4).setValue(totalParcelas);
      sheetCompras.getRange(i + 1, 5).setValue(dataCompra);
      found = true;
      break;
    }
  }
  if (!found) return { success: false, message: 'Compra nao encontrada.' };

  var sheetParcelas = ss.getSheetByName('Parcelas');
  var parcelaData = sheetParcelas.getDataRange().getValues();
  var rowsToDelete = [];
  for (var j = 1; j < parcelaData.length; j++) {
    if (String(parcelaData[j][1]) === idCompra) {
      rowsToDelete.push(j + 1);
    }
  }
  for (var k = rowsToDelete.length - 1; k >= 0; k--) {
    sheetParcelas.deleteRow(rowsToDelete[k]);
  }

  var dataParts = dataCompra.split('-');
  var mesCompra = parseInt(dataParts[1]);
  var anoCompra = parseInt(dataParts[0]);
  var vencimento = getConfig('vencimento') || '10';

  for (var p = 1; p <= totalParcelas; p++) {
    var mesRef = mesCompra + p;
    var anoRef = anoCompra;
    while (mesRef > 12) { mesRef -= 12; anoRef++; }
    var mesPgt = mesRef + 1;
    var anoPgt = anoRef;
    while (mesPgt > 12) { mesPgt -= 12; anoPgt++; }
    var mesRefStr = anoRef + '-' + String(mesRef).padStart(2, '0');
    var mesPgtStr = anoPgt + '-' + String(mesPgt).padStart(2, '0');
    var idParcela = idCompra + '_' + p;
    var dataVenc = mesPgtStr + '-' + String(vencimento).padStart(2, '0');

    sheetParcelas.appendRow([
      idParcela, idCompra, descricao, p, totalParcelas,
      valorParcelas, mesRefStr, mesPgtStr, dataVenc,
      'NAO', 0, '', dataCompra
    ]);
  }

  return { success: true, message: 'Compra editada com sucesso!' };
}

function deleteCompra(idCompra) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetCompras = ss.getSheetByName('Compras');
  var compraData = sheetCompras.getDataRange().getValues();
  for (var i = 1; i < compraData.length; i++) {
    if (String(compraData[i][0]) === idCompra) {
      sheetCompras.deleteRow(i + 1);
      break;
    }
  }
  var sheetParcelas = ss.getSheetByName('Parcelas');
  var parcelaData = sheetParcelas.getDataRange().getValues();
  var rowsToDelete = [];
  for (var j = 1; j < parcelaData.length; j++) {
    if (String(parcelaData[j][1]) === idCompra) {
      rowsToDelete.push(j + 1);
    }
  }
  for (var k = rowsToDelete.length - 1; k >= 0; k--) {
    sheetParcelas.deleteRow(rowsToDelete[k]);
  }
  return { success: true, message: 'Compra excluida com sucesso!' };
}

function deleteAvulso(id) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Avulsos');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Avulso excluido!' };
    }
  }
  return { success: false, message: 'Avulso nao encontrado.' };
}

function getResumo(mesReferencia) {
  inicializarPlanilha();
  var parcelas = getParcelas(mesReferencia);
  var avulsos = getAvulsos(mesReferencia);

  var totalDebitoAtual = 0;
  var totalValorPago = 0;

  for (var i = 0; i < parcelas.length; i++) {
    totalDebitoAtual += Number(parcelas[i].valorParcela);
    if (parcelas[i].pago) {
      totalValorPago += Number(parcelas[i].valorPago);
    }
  }

  for (var j = 0; j < avulsos.length; j++) {
    totalValorPago += Number(avulsos[j].valor);
  }

  var mesAnterior = obterMesAnterior(mesReferencia);
  var saldoAnterior = getSaldoPendente(mesAnterior);
  var totalDebitoGeral = Math.max(0, totalDebitoAtual - saldoAnterior);
  var saldoPendente = totalDebitoGeral - totalValorPago;

  return {
    totalDebitoAtual: totalDebitoAtual,
    totalDebitoGeral: totalDebitoGeral,
    totalValorPago: totalValorPago,
    saldoPendente: saldoPendente,
    saldoAnterior: saldoAnterior,
    mesAnterior: mesAnterior,
    mesPagamento: obterProximoMes(mesReferencia),
    vencimento: getConfig('vencimento') || '10',
    parcelas: parcelas,
    avulsos: avulsos,
    mesFormatado: formatarMesAno(mesReferencia)
  };
}

function getSaldoPendente(mesReferencia) {
  return _calcSaldoComCache(mesReferencia, {});
}

function _calcSaldoComCache(mesReferencia, cache) {
  if (!mesReferencia || mesReferencia < '2000-01') return 0;
  if (cache[mesReferencia] !== undefined) return cache[mesReferencia];

  var parcelas = getParcelas(mesReferencia);
  var avulsos = getAvulsos(mesReferencia);

  var totalDebito = 0;
  var totalPago = 0;

  for (var i = 0; i < parcelas.length; i++) {
    totalDebito += Number(parcelas[i].valorParcela);
    if (parcelas[i].pago) {
      totalPago += Number(parcelas[i].valorPago);
    }
  }
  for (var j = 0; j < avulsos.length; j++) {
    totalPago += Number(avulsos[j].valor);
  }

  if (totalDebito === 0 && totalPago === 0 && parcelas.length === 0 && avulsos.length === 0) {
    var result = _calcSaldoComCache(obterMesAnterior(mesReferencia), cache);
    cache[mesReferencia] = result;
    return result;
  }

  var saldoAnt = _calcSaldoComCache(obterMesAnterior(mesReferencia), cache);
  var totalDebitoGeral = Math.max(0, totalDebito - saldoAnt);
  var saldoPendente = totalDebitoGeral - totalPago;

  cache[mesReferencia] = saldoPendente;
  return saldoPendente;
}

function finalizarMes(mesReferencia) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MesesFinalizados');
  sheet.appendRow([mesReferencia]);
  return { success: true, message: 'Mes finalizado com sucesso!' };
}

function isMesFinalizado(mesReferencia) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MesesFinalizados');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === mesReferencia) return true;
  }
  return false;
}

function getCompra(idCompra) {
  inicializarPlanilha();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Compras');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idCompra) {
      return {
        id: String(data[i][0]),
        descricao: String(data[i][1]),
        valorTotal: Number(data[i][2]),
        totalParcelas: Number(data[i][3]),
        dataCompra: String(data[i][4]),
        ativa: String(data[i][5])
      };
    }
  }
  return null;
}

function getMesAtual() {
  var hoje = new Date();
  var mes = hoje.getMonth() + 1;
  var ano = hoje.getFullYear();
  return ano + '-' + String(mes).padStart(2, '0');
}
