# Jogos do dia — sua própria API

Um robô do GitHub consulta a sua fonte **uma vez a cada 15 minutos** e publica
o resultado num arquivo JSON. Todos os seus aparelhos leem desse arquivo, sem
gastar consulta nenhuma da sua chave.

- 96 consultas por dia no total (cabe no plano grátis de 100/dia)
- Quantos celulares, tablets e TVs você quiser, sem custo
- Se a fonte cair, o último arquivo bom continua no ar
- Hospedagem gratuita, sem servidor para manter

## Passo a passo (uns 10 minutos)

1. Crie um repositório **público** no GitHub, por exemplo `jogos-do-dia`.

2. Envie estes arquivos para ele (pode ser pelo site mesmo, em
   *Add file → Upload files*):
   - `collect.mjs`
   - `.github/workflows/jogos.yml`
   - `docs/jogos.json`

3. No repositório, vá em **Settings → Secrets and variables → Actions →
   New repository secret**:
   - Name: `FONTES`
   - Secret: o endereço da sua API. Pode pôr mais de um, **um por linha** —
     o robô tenta na ordem até um funcionar.

4. Vá na aba **Actions**, escolha *Coletar jogos do dia* e clique em
   **Run workflow** para rodar na hora. Em menos de um minuto o arquivo
   `docs/jogos.json` aparece atualizado.

5. O endereço do seu JSON é:

       https://raw.githubusercontent.com/SEU_USUARIO/jogos-do-dia/main/docs/jogos.json

   Cole esse endereço no app, em **Ajustes → Endereço da lista de jogos**,
   e deixe a sua API original na segunda linha, como reserva.

## Observações

- O repositório precisa ser público para o endereço `raw` funcionar sem login.
  **A sua chave não fica no repositório** — ela vive no Secret, que não aparece
  para ninguém.
- O GitHub guarda o arquivo em cache por alguns minutos. Para placar ao vivo
  isso dá um atraso de até uns 5 minutos.
- Se quiser atualizar mais rápido, troque o `*/15` do cron por `*/10`
  (144 consultas/dia) — aí confira o limite do seu plano.
- O GitHub pausa agendamentos em repositórios sem atividade por 60 dias.
  Um commit qualquer reativa.

## Formato publicado

```json
{
  "atualizado_em": "2026-11-13T21:45:00.000Z",
  "fonte": "apitofinal.fun",
  "total": 3,
  "jogos": [
    {
      "competicao": "Brasileirão Série A",
      "horario": "21:30",
      "data_jogo": "hoje",
      "time1": "Bahia",
      "time2": "Vitória",
      "status": "ao_vivo",
      "placar_time1": "2",
      "placar_time2": "1",
      "minuto": "67'",
      "canais": ["Premiere", "SporTV"]
    }
  ]
}
```
