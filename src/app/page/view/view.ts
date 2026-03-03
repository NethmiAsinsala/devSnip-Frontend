import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SnippetService } from '../../service/snippet.service';
import { HighlightModule } from 'ngx-highlightjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, HighlightModule],
  templateUrl: './view.html',
  styleUrl: './view.css',
})
export class View {
  snippet: any = null;

  constructor(
    private route: ActivatedRoute,
    private snippetService: SnippetService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(){
    const snippetId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSnippet(snippetId);
  }

  loadSnippet(snippetId: number){
    // Since there's no get-by-id in backend, we get all and filter
    this.snippetService.getAllSnippets().subscribe(data => {
      this.snippet = data.find((s: any) => s.id === snippetId);
      this.cdr.detectChanges();
    });
  }
}
