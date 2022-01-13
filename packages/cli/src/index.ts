type OptionDescription = [
  option: string,
  description?: string,
  defaultValue?: boolean | string
]

export type Task<
  Handler extends (...args: Array<any>) => void | Promise<void> = () => void
> = {
  command?: string
  description?: string
  options?: Array<OptionDescription>
  action: Handler // (options: Partial<Options>) => void | Promise<void>
}
