import { Routes } from '@angular/router';
import { LoginComponent } from './page/login/login';
import { View } from './page/view/view';
import { Folder } from './page/folder/folder';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "login",
        pathMatch: "full"
    },
    {
        path: "login",
        component: LoginComponent
    },
    {
        path: "folder",
        component: Folder,
        children:[
            {
                path:"view",
                component:View
            }
        ]

    }
];
