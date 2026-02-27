import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Folder } from './folder';

describe('Folder', () => {
  let component: Folder;
  let fixture: ComponentFixture<Folder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Folder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Folder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
