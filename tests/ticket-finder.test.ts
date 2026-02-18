import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  allLaneDirs,
  computeNextTicketNumber,
  findTicketFile,
  laneDir,
  parseOwnerFromMd,
  parseTicketArg,
} from "../src/lib/ticket-finder";

describe("ticket-finder", () => {
  describe("laneDir", () => {
    test("returns work/<lane> path", () => {
      expect(laneDir("/team", "backlog")).toBe(path.join("/team", "work", "backlog"));
      expect(laneDir("/team", "in-progress")).toBe(path.join("/team", "work", "in-progress"));
    });
  });

  describe("allLaneDirs", () => {
    test("returns all four lane paths", () => {
      const dirs = allLaneDirs("/team");
      expect(dirs).toHaveLength(4);
      expect(dirs).toContain(path.join("/team", "work", "backlog"));
      expect(dirs).toContain(path.join("/team", "work", "in-progress"));
      expect(dirs).toContain(path.join("/team", "work", "testing"));
      expect(dirs).toContain(path.join("/team", "work", "done"));
    });
  });

  describe("parseTicketArg", () => {
    test("pads numeric shorthand to 4 digits", () => {
      expect(parseTicketArg("30")).toEqual({ ticketArg: "0030", ticketNum: "0030" });
      expect(parseTicketArg("7")).toEqual({ ticketArg: "0007", ticketNum: "0007" });
    });
    test("keeps full 4-digit as-is", () => {
      expect(parseTicketArg("0030")).toEqual({ ticketArg: "0030", ticketNum: "0030" });
      expect(parseTicketArg("0007")).toEqual({ ticketArg: "0007", ticketNum: "0007" });
    });
    test("extracts ticket num from 0007-foo format", () => {
      expect(parseTicketArg("0007-some-ticket")).toEqual({ ticketArg: "0007-some-ticket", ticketNum: "0007" });
    });
    test("returns null ticketNum for non-matching formats", () => {
      const r = parseTicketArg("abc");
      expect(r.ticketArg).toBe("abc");
      expect(r.ticketNum).toBeNull();
    });
  });

  describe("parseOwnerFromMd", () => {
    test("extracts Owner line", () => {
      expect(parseOwnerFromMd("# Ticket\n\nOwner: alice\n\nBody")).toBe("alice");
      expect(parseOwnerFromMd("Owner: bob")).toBe("bob");
    });
    test("returns null when no Owner line", () => {
      expect(parseOwnerFromMd("# Ticket\n\nNo owner here")).toBeNull();
      expect(parseOwnerFromMd("")).toBeNull();
    });
  });

  describe("findTicketFile", () => {
    test("finds ticket by number", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-finder-"));
      const backlogDir = path.join(teamDir, "work", "backlog");
      await fs.mkdir(backlogDir, { recursive: true });
      const ticketPath = path.join(backlogDir, "0007-sample.md");
      await fs.writeFile(ticketPath, "# 0007-sample\n\nContent", "utf8");
      try {
        const found = await findTicketFile({ teamDir, ticket: "7" });
        expect(found).toBe(ticketPath);
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });

    test("returns null when ticket not found", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-finder-"));
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });
      try {
        const found = await findTicketFile({ teamDir, ticket: "9999" });
        expect(found).toBeNull();
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });
  });

  describe("computeNextTicketNumber", () => {
    test("returns 1 when no tickets exist", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-finder-"));
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });
      try {
        const next = await computeNextTicketNumber(teamDir);
        expect(next).toBe(1);
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });
    test("returns max+1 from lane dirs", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-finder-"));
      const backlogDir = path.join(teamDir, "work", "backlog");
      const inProgressDir = path.join(teamDir, "work", "in-progress");
      await fs.mkdir(backlogDir, { recursive: true });
      await fs.mkdir(inProgressDir, { recursive: true });
      await fs.writeFile(path.join(backlogDir, "0003-old.md"), "# 0003", "utf8");
      await fs.writeFile(path.join(inProgressDir, "0015-current.md"), "# 0015", "utf8");
      try {
        const next = await computeNextTicketNumber(teamDir);
        expect(next).toBe(16);
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });
  });
});
