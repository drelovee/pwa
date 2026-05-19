export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}
export function error(message: string, status = 400) {
  return Response.json({ message }, { status });
}
