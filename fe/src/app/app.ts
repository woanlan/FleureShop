import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Header } from './components/layout/header/header';
import { Footer } from './components/layout/footer/footer';
import { Icon } from './components/shared/icon/icon';
import { ShopService } from './services/shop.service';

@Component({
  imports: [RouterOutlet, RouterLink, Header, Footer, Icon],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('FLEURÉ – Flower Boutique');
  readonly shop = inject(ShopService);
}
