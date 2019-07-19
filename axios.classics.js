/*
* -- axios 简单封装
* */

//判断进度条框架是否存在NProgress
const axiosLifecycle = {
  start: () => {
      if (NProgress) {
          NProgress.start();
      }
  },
  done: () => {
      if (NProgress) {
          NProgress.done();
      }
  },
  msg: ({msg = '请求失败', type = 'error'}) => {
      if (vm && vm.$message) {
          vm.$message({
              type: type,
              message: msg
          })
      }
  }
};

//添加请求拦截器
axios.interceptors.request.use(config => {
  //顶部进度条开始
  axiosLifecycle.start();
  return config;
}, error => {
  axiosLifecycle.msg({msg: '访问失败'});
  return Promise.resolve(error);
});

// 添加响应拦截器
axios.interceptors.response.use(response => {
  // 根据后端接口code执行操作
  axiosLifecycle.done();//顶部进度条结束
  return response.data;
}, error => {
  let errMsg = `连接到服务器失败`;
  if (error && error.response) {
      errMsg = `请求异常，状态码：${error.response.status}`;
  }
  axiosLifecycle.msg({msg: errMsg});
  //顶部进度条结束
  axiosLifecycle.done();
  return Promise.reject(error.response);
});

//封装
const _Axios = ({url, method, data}) => {
  data = data || {};
  method = method || 'GET';
  let httpDefault = {
      method: method,
      url: typeof url == 'object' ? url.url : url,
      params: method === 'GET' || method === 'DELETE' ? data : null,// `params` 是即将与请求一起发送的 URL 参数 params是添加到url的请求字符串中的，用于get请求。
      data: method === 'POST' || method === 'PUT' ? data : null,// `data` 是作为请求主体被发送的数据 data是添加到请求体（body）中的，用于post请求。
  };
  return new Promise((resolve, reject) => {
      axios(httpDefault)
          .then((res) => {
              if (typeof url == 'object' && url.title) {
                  console.log(url.title, res);
              }
              resolve(res);
          }).catch((response) => {
          reject(response);
      });
  });
};
//请求状态
let interceptorStorage = [];
//过滤请求状态
const interceptorFilter = (obj) => {
  return new Promise((resolve, reject) => {
      if (!obj || Object.prototype.toString.call(obj) != "[object Object]") {
          reject(obj);
      }
      const objJSON = JSON.stringify(obj);
      let have = interceptorStorage.filter((i) => {
          return i == objJSON;
      });
      if (have.length != 0) {
          reject(obj);
      } else {
          interceptorStorage.push(objJSON);
          resolve(obj);
      }
  });
};
const interceptorEnd = (obj) => {
  const objJSON = JSON.stringify(obj);
  interceptorStorage = interceptorStorage.filter((i) => {
      return objJSON && objJSON != i;
  });
};
const interceptorStatus = (key) => {
  if(key){
      eval(key + '=' + !eval(key));
      return true;
  }
};
//loading 拦截器
const _AxiosInterceptor = (options = {},key) => {
  return new Promise((resolve, reject) => {
      if (key && eval(key)) {
          reject('请求已被拦截');
      } else {
          interceptorStatus(key);
          interceptorFilter(options).then((obj) => {
              _Axios(obj).then((res) => {
                  interceptorEnd(obj);
                  resolve(res);
                  interceptorStatus(key);
              }).catch((err) => {
                  // reject(err);
                  interceptorStatus(key);
              });
          }).catch((err) => {
              reject('请求已被拦截：', options);
          });
      }
  });
};