import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ShopService } from '../../../services/shop.service';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly shop = inject(ShopService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearSearchTimer());
  }

  private clearSearchTimer(): void {
    if (this.searchTimer !== null) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.shop.searchQuery.set(value);
    this.clearSearchTimer();

    if (!value.trim()) {
      this.shop.searchProductsFromApi('');
      return;
    }

    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.shop.searchProductsFromApi(value);
    }, 250);
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.clearSearchTimer();
    const trimmed = this.shop.searchQuery().trim();
    this.shop.searchProductsFromApi(trimmed);
    this.router.navigate(['/products'], {
      queryParams: trimmed ? { search: trimmed } : {},
    });
  }

  clearSearch(): void {
    this.clearSearchTimer();
    this.shop.searchQuery.set('');
    this.shop.searchProductsFromApi('');
    this.searchInput()?.nativeElement?.focus();
  }
}
