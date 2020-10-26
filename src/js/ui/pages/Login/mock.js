import wfc from '../../../wfc/client/wfc';
window.wfc = window.wfc || wfc;
const random = n => (Math.random() + 1).toString(36).slice(n);
const logger = {
  logs: [],
  log(...rest) {
    this.logs.push(rest);
  },
  output(name = '') {
    console.group(name);
    this.logs.splice(0).forEach((rest, index) => {
      console.log(...[index + 1].concat(rest));
      console.log('');
    })
    console.groupEnd(name);
  }
}

/**
 * 账号登录
 */
export const login = async (username = 'test', password = '000000', clientId = '') => {
  clientId = clientId || wfc.getClientId();
  logger.log('准备登录, 当前登录信息: ', { username, password, clientId });
  const response = await fetch('http://oasys.geeyao.com/ck_oa/api/auth/login.geeYao', {
    'credentials': 'include',
    'headers': {
      'accept': '*/*',
      'accept-language': 'en-US',
      'access-control-expose-headers': 'timeStamp',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    'referrerPolicy': 'no-referrer-when-downgrade',
    'body': `username=${username}&password=${password}&clientId=${clientId}&platform=3`,
    'method': 'POST',
    'mode': 'cors'
  });
  const { data } = await response.json();
  const { userId, data: { imToken: token } } = data;
  logger.log('登录成功! 获取到连接SDK所需的信息:', { userId, token });
  return { userId, token };
}

/**
 * 连接IM服务器
 */
export const connect = async (userId, token) => {
  return new Promise(async (resolve, reject) => {
    logger.log('准备连接sdk', { userId, token })
    wfc.eventEmitter.on('connectionStatusChanged', (status) => {
      if (status === 1) {
        logger.log('连接sdk成功');
        resolve();
      }
    })
    await wfc.connect(userId, token);
  })
}

/**
 * 将传入的参数与它们的默认值合并
 */
export const mergeParams = (params = {}) => {
  const groupId = random(-6);
  return Object.assign({
    groupId,
    groupType: 2,
    name: 'pc-' + groupId,
    portrait: '',
    memberIds: [],
    lines: [0],
    notifyContent: null,
    successCB() { },
    failCB() { }
  }, params);
}
/**
 * 创建群
 * @param userId 用户id
 * @param ids 群成员id数组
 */
export const createGroup = async (userId, ids = ['b88219890f5111eb826952540075e1aa']) => {
  return new Promise((successCB, failCB) => {
    const params = mergeParams({
      memberIds: [userId].concat(ids),
      successCB,
      failCB
    });
    const {
      groupId,
      groupType,
      name,
      portrait,
      memberIds,
      lines,
      notifyContent
    } = params;
    logger.log('创建群, 传入的参数对应的值:', params);
    wfc.createGroup(
      groupId,
      groupType,
      name,
      portrait,
      memberIds,
      lines,
      notifyContent,
      successCB,
      failCB
    );
  });
}

/**
 * 获取群成员列表
 */
export const getGroupMembers = async (groupId = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(wfc.getGroupMembers(groupId, true));
    }, 1e3);
  });
}

export default async () => {
  const { userId, token } = await login();
  
  await connect(userId, token);

  const groupId = await createGroup(userId);
  const members = await getGroupMembers(groupId);

  logger.log(`获取群成员列表, 如果没有获取到, 可手动获取 wfc.getGroupMembers('${groupId}', true)`, members);
  logger.log('群成员列表中是否有成员带有群主标识? ' + (members.filter(item => item.type === '2').length === 0 ? '无' : '有'))
  setTimeout(() => {
    logger.output('从登录到获取群成员列表整个过程的输出信息');
  });
  return members;
}