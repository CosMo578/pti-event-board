/**
 * Manual XSS / allowlist checks for sanitizeDescriptionHtml.
 * Run: pnpm exec jiti scripts/verify-sanitize.ts
 */
import { sanitizeDescriptionHtml } from "../src/lib/sanitize-description";

const cases: Array<{ name: string; input: string; assert: (out: string) => boolean }> = [
  {
    name: "keeps allowed formatting",
    input: "<p>Hello <strong>world</strong></p><ul><li>one</li></ul>",
    assert: (out) =>
      out === "<p>Hello <strong>world</strong></p><ul><li>one</li></ul>",
  },
  {
    name: "strips script tags and content",
    input: '<p>ok</p><script>alert(1)</script>',
    assert: (out) => out === "<p>ok</p>" && !out.includes("alert"),
  },
  {
    name: "strips event handler attributes",
    input: '<p onclick="alert(1)" onmouseover="alert(2)">x</p>',
    assert: (out) => out === "<p>x</p>",
  },
  {
    name: "strips img onerror",
    input: '<p>x</p><img src=x onerror="alert(1)">',
    assert: (out) => out === "<p>x</p>" && !/onerror|img/i.test(out),
  },
  {
    name: "strips javascript: anchors",
    input: '<p><a href="javascript:alert(1)">click</a></p>',
    assert: (out) => out === "<p>click</p>" && !/javascript:/i.test(out),
  },
  {
    name: "defeats nested script obfuscation",
    input: "<scr<script>ipt>alert(1)</script>",
    assert: (out) => !/script|alert/i.test(out),
  },
  {
    name: "normalizes void br and drops attrs",
    input: '<br class="x" /><br onclick="alert(1)">',
    assert: (out) => out === "<br><br>",
  },
  {
    name: "strips html comments",
    input: "<p>a</p><!-- <script>alert(1)</script> --><p>b</p>",
    assert: (out) => out === "<p>a</p><p>b</p>",
  },
  {
    name: "lowercases allowed tags",
    input: "<P><STRONG>Hi</STRONG></P>",
    assert: (out) => out === "<p><strong>Hi</strong></p>",
  },
  {
    name: "strips style tags with content",
    input: "<style>body{display:none}</style><p>x</p>",
    assert: (out) => out === "<p>x</p>",
  },
];

let failed = 0;
for (const c of cases) {
  const out = sanitizeDescriptionHtml(c.input);
  const ok = c.assert(out);
  if (!ok) {
    failed += 1;
    console.error(`FAIL: ${c.name}\n  in:  ${c.input}\n  out: ${out}`);
  } else {
    console.log(`ok: ${c.name}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}

console.log(`\nAll ${cases.length} cases passed`);
