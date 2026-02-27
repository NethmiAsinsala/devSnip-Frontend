import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  private router = inject(Router);
  private http = inject(HttpClient);

  email: string = '';
  password: string = '';

  login() {

    const user = {
      email: this.email,
      password: this.password
    };

    this.http.post<boolean>(
      "http://localhost:8080/api/users/login",
      user
    ).subscribe(res => {

      if(res){
        this.router.navigate(['/folder']);
      }
      else{
        alert("Invalid email or password");
      }

    });

  }

}