import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { EventNew } from './pages/event-new/event-new';
import { EventEdit } from './pages/event-edit/event-edit';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'new', component: EventNew },
  { path: 'edit/:id', component: EventEdit },
  { path: '**', redirectTo: '' }
];
