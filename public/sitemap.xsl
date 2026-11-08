<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap — ProToolBox</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #334155;
            background: #f8fafc;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 1080px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            padding: 32px;
            border: 1px solid #e2e8f0;
          }
          h1 {
            color: #0f172a;
            font-size: 26px;
            margin: 0 0 8px 0;
            font-weight: 700;
          }
          .desc {
            color: #64748b;
            font-size: 14.5px;
            margin: 0 0 24px 0;
            line-height: 1.6;
          }
          .desc a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          }
          .desc a:hover {
            text-decoration: underline;
          }
          .count-badge {
            background: #eff6ff;
            color: #2563eb;
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
            border: 1px solid #bfdbfe;
            display: inline-block;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 10px;
          }
          th {
            background-color: #2563eb;
            color: #ffffff;
            text-align: left;
            padding: 12px 16px;
            font-weight: 600;
            letter-spacing: 0.3px;
          }
          th:first-child {
            border-top-left-radius: 8px;
          }
          th:last-child {
            border-top-right-radius: 8px;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          tr:hover td {
            background-color: #f1f5f9;
          }
          td a {
            color: #0284c7;
            text-decoration: none;
            word-break: break-all;
          }
          td a:hover {
            color: #0369a1;
            text-decoration: underline;
          }
          .date-col {
            color: #64748b;
            font-size: 13px;
            white-space: nowrap;
          }
          .footer-note {
            margin-top: 28px;
            padding-top: 18px;
            border-top: 1px solid #e2e8f0;
            font-size: 12.5px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>XML Sitemap</h1>
          <p class="desc">
            Generated dynamically by <strong><a href="https://protoolbox.in">ProToolBox</a></strong> for Google, Bing and other search engine bots.
          </p>

          <xsl:if test="sitemap:sitemapindex">
            <p class="count-badge">
              This XML Sitemap Index file contains <strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong> sitemaps.
            </p>
            <table>
              <thead>
                <tr>
                  <th width="70%">Sitemap</th>
                  <th width="30%">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                  <tr>
                    <td>
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td class="date-col">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:if>

          <xsl:if test="sitemap:urlset">
            <p class="count-badge">
              This XML Sitemap contains <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URLs.
            </p>
            <table>
              <thead>
                <tr>
                  <th width="60%">URL</th>
                  <th width="12%">Priority</th>
                  <th width="13%">Change Freq</th>
                  <th width="15%">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:value-of select="sitemap:priority"/>
                    </td>
                    <td>
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                    <td class="date-col">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:if>

          <div class="footer-note">
            ProToolBox Dynamic SEO Sitemap • Compliant with Sitemaps.org Protocol
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

