# Plano de Resposta a Incidentes de Segurança de Dados (LGPD)

Este documento estabelece os procedimentos internos da **Bartime** em caso de violação de dados ou incidente de segurança que possa acarretar risco ou dano relevante aos titulares (Art. 48 da LGPD).

## 1. Definição de Incidente
Qualquer evento adverso, confirmado ou suspeito, relacionado à violação na segurança de dados pessoais, tais como:
- Acesso não autorizado;
- Destruição, perda ou alteração acidental ou ilícita;
- Comunicação ou difusão indevida de dados.

## 2. Equipe de Resposta
A equipe de resposta a incidentes é composta por:
- **DPO (Encarregado de Dados):** Coordena a resposta e comunicações.
- **CTO / Liderança Técnica:** Lidera a investigação técnica, contenção e remediação.
- **CEO / Diretoria:** Aprova comunicações externas e decisões estratégicas.
- **Assessoria Jurídica:** Orienta sobre notificações à ANPD e obrigações legais.

## 3. Fases de Resposta

### Fase 1: Identificação e Comunicação Interna (Imediato)
- Qualquer colaborador que suspeitar de um incidente deve notificar o DPO imediatamente (privacidade@bartime.com.br).
- O DPO registrará a data/hora da suspeita, sistemas afetados, quem relatou e os sintomas do incidente.
- Reunião de emergência da Equipe de Resposta.

### Fase 2: Contenção (Até 24h)
- **Isolamento:** Desconectar sistemas comprometidos, bloquear IPs suspeitos ou suspender acesso a contas afetadas.
- **Mitigação:** Reset forçado de senhas, revogação de tokens de acesso, aplicação de patches emergenciais.
- *Importante:* Preservar logs (AuditLog) e evidências do ataque antes de realizar limpezas profundas.

### Fase 3: Investigação e Análise de Risco (Até 48h)
- Determinar a origem do vazamento (falha de sistema, engenharia social, etc.).
- Identificar as categorias de dados afetados (ex: senhas, dados de contato, agendamentos).
- Identificar o número aproximado de titulares afetados.
- O DPO e a Assessoria Jurídica devem avaliar a "relevância do risco" conforme diretrizes da ANPD.

### Fase 4: Notificação (Prazo: 2 dias úteis contados do conhecimento)
Se confirmado risco ou dano relevante, o DPO deve proceder com as seguintes notificações:

**A. Notificação à ANPD:**
- Preencher o formulário de comunicação de incidente no site gov.br/anpd.
- Descrever a natureza dos dados afetados, número de titulares envolvidos, medidas técnicas de segurança adotadas antes e depois do incidente, e riscos relacionados.

**B. Notificação aos Titulares (Clientes, Profissionais, Tenants):**
- Canal: E-mail (ou aviso em destaque no painel da plataforma).
- Conteúdo claro e simples:
  1. Descrição da natureza dos dados pessoais afetados;
  2. Informações sobre os titulares envolvidos;
  3. Riscos relacionados ao incidente;
  4. Medidas técnicas e de segurança utilizadas;
  5. Contato do DPO.

### Fase 5: Erradicação, Recuperação e Lições Aprendidas (Pós-Incidente)
- Restaurar sistemas a partir do backup seguro mais recente.
- Monitorar a rede intensamente por 30 dias para garantir que a ameaça foi totalmente removida.
- Elaborar relatório final (Post-Mortem) com: o que ocorreu, tempo de resposta, eficácia das medidas e plano de ação para evitar recorrências (ex: auditoria de código, treinamento de equipe).

## 4. Registro Interno
Ainda que o incidente não seja notificado à ANPD (por ser avaliado como baixo risco), a Bartime deve manter registro interno do ocorrido por no mínimo 5 anos, detalhando os motivos pelos quais se decidiu não notificar.
