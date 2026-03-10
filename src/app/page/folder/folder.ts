import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SnippetService } from '../../service/snippet.service';
import { FolderService } from '../../service/folder.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-folder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folder.html',
  styleUrl: './folder.css',
})
export class Folder implements OnInit {

  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private snippetService = inject(SnippetService);
  private folderService = inject(FolderService);

  folders: any[] = [];
  filteredFolders: any[] = [];
  isCreateModalOpen: boolean = false;
  newFolderName: string = '';
  searchQuery: string = '';
  totalSnippets: number = 0;
  activeFolders: number = 0;
  totalFavorites: number = 0;
  pinnedTags: { name: string, count: number }[] = [];

  ngOnInit(): void {
    this.loadFolders();
    this.loadSnippetsStats();
  }

  loadSnippetsStats(): void {
    this.snippetService.getAllSnippets().subscribe({
      next: (data) => {
        this.totalSnippets = data.length;
        this.totalFavorites = data.filter((s: any) => s.isFavorite).length || 0;

        const tagCounts = new Map<string, number>();
        data.forEach((s: any) => {
          let tags: string[] = [];
          if (s.tagName) {
            if (Array.isArray(s.tagName)) {
              tags = s.tagName.filter((t: any) => t && t.toString().trim());
            } else if (typeof s.tagName === 'string') {
              tags = s.tagName.split(',').map((t: any) => t.trim()).filter(Boolean);
            }
          }
          tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        this.pinnedTags = Array.from(tagCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load snippet stats', err);
      }
    });
  }

  loadFolders(): void {
    this.folderService.getAllFolders()
      .subscribe({
        next: (data) => {
          this.folders = data;
          this.activeFolders = data.length;
          this.filterFolders(); // apply search if present
        },
        error: (err) => {
          console.error('Failed to load folders:', err);
        }
      });
  }

  filterFolders(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFolders = [...this.folders];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredFolders = this.folders.filter(f =>
        f.name?.toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  openCreateModal(): void {
    this.newFolderName = '';
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  createFolder(): void {
    if (!this.newFolderName.trim()) return;

    this.folderService.createFolder(this.newFolderName).subscribe({
      next: (res) => {
        this.closeCreateModal();
        this.loadFolders(); // refresh list
      },
      error: (err) => {
        alert('Failed to create folder');
        console.error(err);
      }
    });
  }

  deleteFolder(event: Event, id: number): void {
    event.stopPropagation(); // prevent opening the folder
    if (confirm("Are you sure you want to delete this folder?")) {
      this.folderService.deleteFolder(id).subscribe({
        next: (res) => {
          this.loadFolders(); // refresh list
        },
        error: (err) => {
          alert('Failed to delete folder');
          console.error(err);
        }
      });
    }
  }

  openFolder(id: number): void {
    this.router.navigate(['/snippet'], { queryParams: { folderId: id } });
  }
}