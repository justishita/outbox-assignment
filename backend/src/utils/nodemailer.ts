import nodemailer from 'nodemailer';

export async function createEtherealAccount() {
  return await nodemailer.createTestAccount();
}

export function createTransporter(etherealUser: string, etherealPass: string, etherealHost: string, etherealPort: number) {
  return nodemailer.createTransport({
    host: etherealHost,
    port: etherealPort,
    secure: etherealPort === 465,
    auth: {
      user: etherealUser,
      pass: etherealPass,
    },
  });
}
