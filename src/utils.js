const UnifyArrayStyle = (path, splitSymbol = '/') => {
  if (!Array.isArray(path)) path = path.split(splitSymbol)
  return path.filter(x => x !== '')
}

const IsEmptyObject = (obj) => {
  return Object.keys(obj).length === 0 ? true : false
}

const RandomStr = (len = 8) => {
  let charts = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')
  let s = ''
  for (let i = 0; i < len; i++) s += charts[(Math.random() * 0x3e) | 0];
  return s;
}

function _genList(str) {
  // string 根据 | 分割为数组
  let list = []
  let items = str.split('|')
  for (let i=0; i<items.length; i++) {
    let item_trim = items[i].trim()
    if (item_trim) list.push(item_trim)
  }
  return list
}

function _genItem(keys, values){
  // 根据 keys - values 返回 object
  let item = {}
  for (let j=0; j<keys.length; j++) {
    item[keys[j]] = values[j]
  }
  return item
}

function _genTableRow(state, state_detail, col_names, line){
  // 根据 参数 处理表格的一行
  let result = {
    state: state,
    state_detail: state_detail,
    isRow: false,
    row: null
  };
  switch (state_detail) {
    case 'T': // title
      if (line.replace(/-/g, '') === ''){
        result.state_detail = 'C'
      } else {
        col_names[state] = _genList(line)
      }
      break;
    case 'C':  // content
      if (line.replace(/-/g, '') === '') {
        result.state_detail = 'S'
      } else {
        result.isRow = true;
        result.row = _genItem(col_names[state], _genList(line));
      }
      break;
    case 'S':
      if (line.replace(/-/g, '') === '') {
        result.state = ''
        result.state_detail = ''
      }
      break;
  }
  return result
}

const ParseSettlementContent = (txt = '') => {
  if (txt === '') return txt
  let lines = txt.split('\n')
  let state = ''; // A = Account Summary; T = Transaction Record; PD = Positions Detail; P = Positions
  let state_detail = ''; // T = title; C = content; S = summary
  let col_names = {};
  let result = {
    account: {},
    transactionRecords: [],
    positions: []
  }
  for(let i=0; i<lines.length; i++) {
    let line = lines[i].trim()
    if (line === '资金状况  币种：人民币  Account Summary  Currency：CNY') {
      state = 'A-S'
      i++;
      continue;
    } else if (line === '成交记录 Transaction Record') {
      state = 'T-S'
      state_detail = 'T'
      i++;
      continue;
    } else if(line === '持仓明细 Positions Detail') {
      state = 'PD-S' // 先不管这一项
      state_detail = 'T'
      i++;
      continue;
    } else if(line === '持仓汇总 Positions') {
      state = 'P-S'
      state_detail = 'T'
      i++;
      continue;
    }
    if (state === 'A-S') {
      if (line.length === 0 || line.replace('-', '') === '') {
        state = ''
        continue
      } else {
        let ch_matches = line.match(/([\u4e00-\u9fa5][\u4e00-\u9fa5\s]+[\u4e00-\u9fa5])+/g) // 中文
        let en_matches = line.match(/([A-Z][a-zA-Z\.\/\(\)\s]+)[:：]+/g) // 英文
        let num_matches = line.match(/(-?[\d]+\.\d\d)/g) // 数字
        for (let j=0; j<en_matches.length; j++) {
          result.account[en_matches[j].split(/[:：]/)[0]] = num_matches[j]
        }
      }
    } else if (state === 'T-S' || state === 'P-S') {
      if (line.length === 0) {
        state = ''
        continue
      } else {
        let tableRow = _genTableRow(state, state_detail, col_names, line)
        state = tableRow.state
        state_detail = tableRow.state_detail
        if (tableRow.isRow) {
          state === 'T-S' ? result.transactionRecords.push(tableRow.row) : result.positions.push(tableRow.row)
        }
      }
    }
  }
  return result
}

export {
  UnifyArrayStyle,
  IsEmptyObject,
  RandomStr,
  ParseSettlementContent
}
