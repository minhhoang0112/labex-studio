export async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `Yêu cầu thất bại (${response.status}).`);
    error.status = response.status;
    error.hint = data?.hint;
    throw error;
  }
  if (data === null) throw new Error('Máy chủ trả về dữ liệu không hợp lệ.');
  return data;
}
