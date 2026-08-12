# Goa Cyber Sunset

Build a beautiful 16-bit pixel-art web shooter with a Goa Sunset x Cyberpunk vibe. The player pilots a small Goan sailboat (64×32px, white sail with cyan neon trim) gliding over a cyber-ocean (bottom ~35% with a cyan→dark gradient and sine-wave swells). The sky is a pixelated sunset gradient (violet→orange→yellow), with a pixel sun. The boat gently bobs with a short sine idle animation (±3px) and moves horizontally via arrows/A-D or touch-drag. The player fires cyan glowing splash projectiles (16×16px) upward from the mast top using space/tap; projectiles travel ~8px/frame. There are 4 floating buoy targets, each representing a required buoy “type,” moving with sine oscillation (±12px), plus horizontal drift (1–1.8px/frame) and edge bounce; each type also visually has a matching neon crate-label color theme. Additionally, one single golden special buoy exists as a rare extra-difficult target: hitting it immediately ends the game and grants a special reward. The win condition is: the player must destroy exactly one buoy of each of the four types (all 4 type buoys destroyed) to trigger game complete; separately, hitting the golden buoy ends the game instantly with its reward. Audio: 8-bit/retro splash-fire and crate-break SFX on firing and buoy destruction. Keep visuals crisp, readable, and strongly pixelated.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/89dc3e7e-3fbe-4d23-b747-94089619ed48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
