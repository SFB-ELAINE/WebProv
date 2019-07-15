export const uniqueId = () => {
  // HTML IDs must begin with a non numeric character or something like that.
  // Thus, we prepend 'A'
  return 'A' + Math.random().toString().substr(2, 9);
};

export const keys = <T extends object>(arg: T) => Object.keys(arg) as Array<keyof T & string>;
