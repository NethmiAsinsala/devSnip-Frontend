import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Snippet } from './snippet';

describe('Snippet', () => {
  let component: Snippet;
  let fixture: ComponentFixture<Snippet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Snippet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Snippet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
