import prisma from '../config/prisma';
import { createEtherealAccount } from '../utils/nodemailer';

export async function findOrCreateUser(googleId: string, name: string, email: string, avatar?: string) {
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId,
        name,
        email,
        avatar,
      },
    });

    // Create 3 Ethereal senders for the user
    for (let i = 0; i < 3; i++) {
      const account = await createEtherealAccount();
      await prisma.sender.create({
        data: {
          userId: user.id,
          etherealUser: account.user,
          etherealPass: account.pass,
          etherealHost: account.smtp.host,
          etherealPort: account.smtp.port,
        },
      });
    }
  }

  return user;
}
