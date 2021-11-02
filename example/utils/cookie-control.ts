export const cookieReset = (splitKey: string): void => {
  document.cookie = `x-split-key-${splitKey}=; path=/; expires=${new Date(
    '1999-12-31T23:59:59Z'
  ).toUTCString()}`
}

export const cookieSet = (splitKey: string, branch: string): void => {
  const date = new Date()
  document.cookie = `x-split-key-${splitKey}=${branch}; path=/; expires=${new Date(
    date.setDate(date.getDate() + 1)
  ).toUTCString()}`
}
