# Versões e publicação

O projeto segue o [versionamento semântico](https://semver.org/lang/pt-BR/) — `MAJOR.MINOR.PATCH`, com uma só versão para a biblioteca toda:

| Tipo | Quando | Commits | Exemplo |
|---|---|---|---|
| **patch** | Correções que não mudam a API | `fix`, `perf`, `docs`, `refactor`… | `1.0.0 → 1.0.1` |
| **minor** | Funcionalidades novas compatíveis (um indicador novo, uma opção nova) | pelo menos um `feat` | `1.0.1 → 1.1.0` |
| **major** | Mudanças que podem partir quem já usa (renomear ou remover API) | um `!` (`feat!:`) ou `BREAKING CHANGE:` | `1.1.0 → 2.0.0` |

Cada versão é uma **tag git** (`v1.0.0`, `v1.1.0`…) com o `dist/` já compilado lá dentro, por isso quem instala não precisa de compilar nada. Cada tag tem também uma [GitHub Release](https://github.com/TTiagoSousa/OpenChartsCandle/releases) com as notas e o pacote (`.tgz`).

## Ramos

| Ramo | Para quê |
|---|---|
| `develop` | Trabalho do dia a dia; os pull requests vão para aqui |
| `staging` | O que vai sair na próxima versão |
| `main` | O código lançado (ramo por defeito) |

O código sobe sempre em fast-forward (`git merge --ff-only`): a história fica linear, sem merge commits. Nada chega a `staging` nem a `main` sem o CI passar nesse commit.

## Publicar uma versão nova

O script `scripts/release.mjs` (`npm run release`) calcula a versão a partir dos commits desde a última tag.

1. Em `develop`, com tudo em commit:

   ```bash
   npm run release -- --prepare
   ```

   Atualiza a versão no `package.json`, no `package-lock.json` e nas linhas de instalação dos READMEs, passa a secção `[Unreleased]` do `CHANGELOG.md` para a nova versão (preenche-a com os commits se estiver vazia), volta a compilar o `dist/` e escreve `releases/vX.Y.Z/en.md` com as secções Features, Fixes e Improvements.

2. Escreve `releases/vX.Y.Z/pt-PT.md` (as notas em português), revê tudo e faz commit:

   ```bash
   git add -A
   git commit -m "chore(release): vX.Y.Z"
   git push origin develop
   ```

3. Quando o CI passar, sobe para `staging` e `main` (o CI corre outra vez em cada um):

   ```bash
   git checkout staging && git merge --ff-only develop && git push origin staging
   git checkout main && git merge --ff-only staging && git push origin main
   ```

4. Em `main`, cria e envia a tag:

   ```bash
   npm run release -- --push
   ```

   Cria a tag anotada `vX.Y.Z` com as notas em inglês e faz push dela. A tag arranca o workflow `release.yml`, que confirma a versão, testa e compila outra vez e cria a GitHub Release com as notas (em inglês e em português) e o pacote. O push para `main` já publicou o site de demonstração no GitHub Pages.

Opções: `--dry-run` mostra o que ia fazer sem mudar nada, `--version X.Y.Z` força uma versão, `--title "…"` dá um título à release e `--allow-branch <ramo>` corre um passo noutro ramo.

## Usar uma versão no teu software

```bash
npm install github:TTiagoSousa/OpenChartsCandle#v1.0.0
```

- **Atualizar:** muda a tag no `package.json` e corre `npm install`.
- **Experimentar sem release:** `#develop` instala o último commit de `develop`. Só para testes.
- **Ver as versões:** na página [Releases](https://github.com/TTiagoSousa/OpenChartsCandle/releases), ou com `git ls-remote --tags https://github.com/TTiagoSousa/OpenChartsCandle.git`.

## Testar no teu software antes de publicar

```bash
# na pasta da biblioteca
npm run build

# na pasta do teu software
npm install ../caminho/para/OpenChartsCandle
```

Depois de cada `npm run build` na biblioteca, o teu software vê as alterações. Quando estiver tudo bem, faz o release e volta a apontar para a tag.
