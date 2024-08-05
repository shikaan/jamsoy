export class InvalidInstructionError extends Error {
  constructor() {
    super();
    this.message = 'Invalid Instruction'
    this.name = 'InvalidInstructionError'
  }
}