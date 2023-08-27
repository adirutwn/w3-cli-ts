import ora, { Ora } from 'ora'

export class Spinner {
  private spinner: Ora

  constructor(_spinner?: Ora) {
    this.spinner = _spinner || ora({ spinner: 'dots' })
  }

  public start(message?: string) {
    if (this.spinner.isSpinning) {
      this.spinner.text = message || ''
      return
    }
    this.spinner.start(message)
  }

  public updateMessage(message: string) {
    if (this.spinner.isSpinning) {
      this.spinner.text = message
      return
    }

    this.spinner.start(message)
  }

  public stop() {
    if (this.spinner.isSpinning) {
      this.spinner.stop()
    }
  }

  public fail(message?: string) {
    if (this.spinner.isSpinning) {
      this.spinner.fail(message)
    }
  }

  public succeed(message?: string) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed(message)
    }
  }

  public info(message?: string) {
    this.spinner.info(message)
  }

  public logInfo(message: string) {
    this.spinner.clear()
    this.spinner.frame()
    console.log(message)
  }
}
