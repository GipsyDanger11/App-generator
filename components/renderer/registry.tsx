'use client';
// Component registry. Add new components here to extend the system.
// All components receive `{ node, appId, entityName, recordId, children }`.

import { Hero } from './components/Hero';
import { Heading } from './components/Heading';
import { Text } from './components/Text';
import { Stats } from './components/Stats';
import { Table } from './components/Table';
import { Form } from './components/Form';
import { Chart } from './components/Chart';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { List } from './components/List';
import { Iframe } from './components/Iframe';
import { Divider, Spacer } from './components/Atoms';
import { ErrorBoundary } from './ErrorBoundary';
import { UnknownComponent } from './UnknownComponent';
import type { ComponentNode } from '@/lib/config/types';

export interface CompProps {
  node: ComponentNode;
  appId: string;
  entityName?: string;
  recordId?: string;
  children?: React.ReactNode;
}

type CompMap = Partial<Record<ComponentNode['kind'], React.ComponentType<CompProps>>>;

export const componentRegistry: CompMap = {
  hero: Hero as React.ComponentType<CompProps>,
  heading: Heading,
  text: Text,
  stats: Stats,
  table: Table,
  form: Form,
  chart: Chart,
  card: Card,
  button: Button,
  list: List,
  iframe: Iframe,
  divider: Divider,
  spacer: Spacer,
};

export { ErrorBoundary, UnknownComponent };
