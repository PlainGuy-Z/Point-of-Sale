import { appApi } from './appApi'

export type PrintMethod = 'browser' | 'rawbt' | 'network'

export const printerService = {

  async testRawBT(ip: string): Promise<boolean> {
    try {
      await appApi.post('/printer/test', { ip })
      return true
    } catch {
      return false
    }
  },

  async printRawBT(ip: string, content: string): Promise<void> {
    await appApi.post('/printer/print', { ip, content })
  },

  printViaBrowser(html: string): void {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  },
}
