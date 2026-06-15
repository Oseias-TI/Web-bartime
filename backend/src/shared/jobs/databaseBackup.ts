import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR ?? '/backups';
const BACKUP_RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS ?? 7);

function parseDatabaseUrl(url: string) {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!match) throw new Error('DATABASE_URL inválida para backup');
    return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
}

async function runBackup() {
    // BUG-09: Validar DATABASE_URL antes do cast para evitar falha silenciosa
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('[Backup] ERRO: DATABASE_URL não definida. Backup abortado.');
        return;
    }
    const db = parseDatabaseUrl(databaseUrl);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup_${db.database}_${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Cria o diretório de backup se não existir
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    // BUG-04: PGPASSWORD passada via env do processo filho, não inline na string do comando
    // Isso evita que a senha fique visível em `ps aux` e `/proc/<pid>/cmdline`
    const command = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} ${db.database} | gzip > ${filepath}`;

    try {
        await execAsync(command, { env: { ...process.env, PGPASSWORD: db.password } });
        const stat = fs.statSync(filepath);
        const sizeMb = (stat.size / 1024 / 1024).toFixed(2);
        console.log(`[Backup] Backup criado: ${filename} (${sizeMb} MB)`);

        // Remove backups antigos
        await purgeOldBackups();
    } catch (err) {
        console.error('[Backup] Erro ao criar backup:', err);
    }
}

async function purgeOldBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql.gz'));
    const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
        const filepath = path.join(BACKUP_DIR, file);
        const stat = fs.statSync(filepath);
        if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(filepath);
            console.log(`[Backup] Backup antigo removido: ${file}`);
        }
    }
}

export function startBackupJob() {
    // Roda todo dia às 3h da manhã
    cron.schedule('0 3 * * *', () => {
        runBackup().catch(console.error);
    });

    console.log('[Jobs] Backup automático agendado para as 3h diariamente.');
}