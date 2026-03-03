import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-folder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folder.html',
  styleUrl: './folder.css',
})
export class Folder implements OnInit {

  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  folders: any[] = [];  

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://localhost:8080/api/folder/get-all', { headers })
      .subscribe({
        next: (data) => {
          this.folders = data; 
          this.cdr.detectChanges();
          console.log('Folders loaded:', data);
        },
        error: (err) => {
          alert('Failed to load folders: ' + err.message);
          console.error('Failed to load folders:', err);
        }
      });
  }

  openFolder(id: number): void {
    this.router.navigate(['/snippet'], { queryParams: { folderId: id } });
  }
}