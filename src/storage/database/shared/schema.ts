import { pgTable, serial, timestamp, varchar, text, numeric, boolean, integer, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 系统健康检查表 - 必须保留
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 线索填报记录表
export const reports = pgTable(
  "reports",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    id_card: varchar("id_card", { length: 18 }),
    company_name: varchar("company_name", { length: 200 }),
    company_address: varchar("company_address", { length: 500 }),
    owed_amount: numeric("owed_amount", { precision: 12, scale: 2 }),
    owed_months: integer("owed_months"),
    worker_count: integer("worker_count"),
    description: text("description"),
    evidence: text("evidence"), // JSON string for evidence files
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("reports_status_idx").on(table.status),
    index("reports_created_at_idx").on(table.created_at),
    index("reports_phone_idx").on(table.phone),
  ]
);

// 在线申请记录表
export const applications = pgTable(
  "applications",
  {
    id: serial().primaryKey(),
    applicant_name: varchar("applicant_name", { length: 50 }).notNull(),
    applicant_phone: varchar("applicant_phone", { length: 20 }).notNull(),
    applicant_id_card: varchar("applicant_id_card", { length: 18 }),
    application_type: varchar("application_type", { length: 50 }).notNull(), // support_prosecution, legal_aid
    case_brief: text("case_brief"),
    owed_amount: numeric("owed_amount", { precision: 12, scale: 2 }),
    supporting_documents: text("supporting_documents"), // JSON string
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    reviewer_notes: text("reviewer_notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("applications_status_idx").on(table.status),
    index("applications_type_idx").on(table.application_type),
    index("applications_created_at_idx").on(table.created_at),
    index("applications_phone_idx").on(table.applicant_phone),
  ]
);

// 文书生成记录表
export const documents = pgTable(
  "documents",
  {
    id: serial().primaryKey(),
    document_type: varchar("document_type", { length: 50 }).notNull(),
    applicant_name: varchar("applicant_name", { length: 50 }),
    applicant_phone: varchar("applicant_phone", { length: 20 }),
    document_content: text("document_content"),
    template_used: varchar("template_used", { length: 100 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("documents_type_idx").on(table.document_type),
    index("documents_created_at_idx").on(table.created_at),
  ]
);

// 咨询记录表
export const consultations = pgTable(
  "consultations",
  {
    id: serial().primaryKey(),
    session_id: varchar("session_id", { length: 100 }),
    user_question: text("user_question").notNull(),
    ai_response: text("ai_response"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("consultations_session_id_idx").on(table.session_id),
    index("consultations_created_at_idx").on(table.created_at),
  ]
);

// 管理员表
export const admins = pgTable(
  "admins",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    last_login: timestamp("last_login", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admins_username_idx").on(table.username),
  ]
);

// 类型导出
export type Report = typeof reports.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Consultation = typeof consultations.$inferSelect;
export type Admin = typeof admins.$inferSelect;
