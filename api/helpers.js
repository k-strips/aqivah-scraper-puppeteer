
exports.returnResponseOrError = response => {
  console.log('response -> ', response.data);
  if (response.status < 200 || response.status >= 300) throw response.data;
  return response.data;
};
