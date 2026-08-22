const fs = require('fs');
const homePath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/home_screen.dart';
let home = fs.readFileSync(homePath, 'utf8');

const target = `          onTap: () {
            if (route == '/farms') {
              ref.read(navigationIndexProvider.notifier).state = 1;
            if (route == '/alerts') {
              ref.read(navigationIndexProvider.notifier).state = 2;
            } else if (route == '/dashboard') {
              ref.read(navigationIndexProvider.notifier).state = 3;
            } else {
              context.push(route);
            }
          },`;

const replacement = `          onTap: () {
            if (route == '/farms') {
              ref.read(navigationIndexProvider.notifier).state = 1;
            } else if (route == '/alerts') {
              ref.read(navigationIndexProvider.notifier).state = 2;
            } else if (route == '/dashboard') {
              ref.read(navigationIndexProvider.notifier).state = 3;
            } else {
              context.push(route);
            }
          },`;

home = home.replace(target, replacement);
fs.writeFileSync(homePath, home, 'utf8');
console.log('✅ Fixed clean onTap routing in home_screen.dart');
