import {redirect} from 'next/navigation';
export const metadata={title:'Vännernas ö – Debatt-AI',description:'Besök åtta AI-vänner på en gemensam 3D-ö. Samtala, upptäck och lös uppdrag på svenska eller engelska.'};
export default function FriendsIsland(){redirect('/vannernas-o/v1/index.html')}
