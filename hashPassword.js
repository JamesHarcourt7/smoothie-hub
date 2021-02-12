
// https://stackoverflow.com/a/7616484
function hash (password) {
  var hash = 0, i, chr;
  for (i = 0; i < password.length; i++) {
    chr   = password.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
