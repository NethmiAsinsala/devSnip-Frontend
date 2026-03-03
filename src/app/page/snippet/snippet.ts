import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SnippetService } from '../../service/snippet.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HighlightModule } from 'ngx-highlightjs';

@Component({
  selector: 'app-snippet',
  standalone: true,
  imports: [CommonModule, HighlightModule],
  templateUrl: './snippet.html',
  styleUrl: './snippet.css',
})
export class Snippet implements OnInit {

  private snippetService = inject(SnippetService);  // ✅ use inject()
  private route = inject(ActivatedRoute);            // ✅ use inject()
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  snippets: any[] = [];
  folders: any[] = [];
  folderId!: number;
  selectedSnippet: any = null;
  codeCopied = false;

  ngOnInit(): void {
    // ✅ respond to query param changes
    this.route.queryParamMap.subscribe(params => {
      this.folderId = Number(params.get('folderId'));
      console.log('Folder ID:', this.folderId); // check if correct
      this.loadSnippets();
    });
    this.loadFolders();
  }

  loadSnippets() {
    this.snippetService
      .getSnippetsByFolder(this.folderId)
      .subscribe({
        next: (data: any[]) => {
          this.snippets = data;
          this.cdr.detectChanges();
          console.log('Snippets loaded:', data);
        },
        error: (err) => {
          console.error('Failed to load snippets:', err);
        }
      });
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
          console.error('Failed to load folders:', err);
        }
      });
  }

  openFolder(id: number): void {
    this.router.navigate(['/snippet'], { queryParams: { folderId: id } });
  }

  openSnippetModal(snippet: any): void {
    this.selectedSnippet = snippet;
    this.codeCopied = false;
  }

  closeModal(): void {
    this.selectedSnippet = null;
    this.codeCopied = false;
  }

  copyCode(): void {
    if (this.selectedSnippet?.code_content) {
      navigator.clipboard.writeText(this.selectedSnippet.code_content).then(() => {
        this.codeCopied = true;
        setTimeout(() => { this.codeCopied = false; }, 2000);
        this.cdr.detectChanges();
      });
    }
  }

  /** Returns tags as a string array regardless of backend format */
  parseTags(tags: any): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.filter(t => t && t.toString().trim());
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
    return [];
  }
}