import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { slugify } from '../lib/slug';
const prisma = new PrismaClient();
async function main(){
 const data=[['Marketing',['SMM','Аналитика','Таргет']],['Design',['UX/UI','Логотипы','Баннеры']],['Content',['Тексты','Копирайтинг','Сценарии']],['Promotion',['Запуск','Реклама','Проекты']]] as const;
 for (const [name,subs] of data){await prisma.category.upsert({where:{slug:slugify(name)},update:{},create:{name,slug:slugify(name),subcategories:{create:subs.map(s=>({name:s,slug:slugify(s)}))}}})}
 const admin=await prisma.user.upsert({where:{email:'admin@skillcrew.local'},update:{isAdmin:true},create:{email:'admin@skillcrew.local',passwordHash:await bcrypt.hash('12345678',10),accountType:'customer',isAdmin:true,profile:{create:{fullName:'Admin',username:'admin',title:'Администратор'}}},include:{profile:true}});
 console.log('Seed complete. Admin:', admin.email, 'password: 12345678');
}
main().finally(()=>prisma.$disconnect());
