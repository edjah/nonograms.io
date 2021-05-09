export const weakReferenceId = (() => {
  let id = 0;
  const map = new WeakMap<any, number>();

  return (obj: any) => {
    if (!map.has(obj)) {
      map.set(obj, id++);
    }
    return map.get(obj)!;
  };
})();
