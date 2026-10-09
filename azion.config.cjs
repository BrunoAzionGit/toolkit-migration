/**
 * This file was automatically generated based on your preset configuration.
 *
 * For better type checking and IntelliSense:
 * 1. Install azion config as dev dependency:
 *    npm install -D @aziontech/config
 *
 * 2. Use defineConfig:
 *    import { defineConfig } from '@aziontech/config'
 *
 * 3. Replace the configuration with defineConfig:
 *    export default defineConfig({
 *      // Your configuration here
 *    })
 *
 * For more configuration options, visit:
 * https://github.com/aziontech/lib/tree/main/packages/config
 */

module.exports = {
  build: {
    preset: 'astro',
    polyfills: true
  },
  // Proxy autenticado para o n8n (ver README). Os segredos ficam em Environment
  // Variables no Azion Console, nunca aqui: este repositório é público.
  functions: [
    {
      name: 'migration-proxy',
      path: './functions/migration-proxy.js',
      runtime: 'azion_js'
    }
  ],
  storage: [
    {
      name: 'toolkit-migration-astro-v1',
      prefix: '20261009001233',
      dir: './dist',
      workloadsAccess: 'read_only'
    }
  ],
  connectors: [
    {
      name: 'toolkit-migration-astro-v1',
      active: true,
      type: 'storage',
      attributes: {
        bucket: 'toolkit-migration-astro-v1',
        prefix: '20261009001233'
      }
    }
  ],
  applications: [
    {
      name: 'toolkit-migration-astro-v1',
      functionsEnabled: true,
      functionsInstances: [
        {
          name: 'migration-proxy',
          ref: 'migration-proxy'
        }
      ],
      cache: [
        {
          name: 'toolkit-migration-astro-v1',
          browser: {
            maxAgeSeconds: 7200
          },
          edge: {
            maxAgeSeconds: 7200
          }
        }
      ],
      rules: {
        request: [
          {
            // Precisa ser a primeira: a regra de subpaths reescreveria /api/* para index.html.
            name: 'API Proxy n8n',
            description: 'Encaminha /api/* para a Function migration-proxy',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'starts_with',
                  argument: '/api/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'run_function',
                attributes: {
                  value: 'migration-proxy'
                }
              }
            ]
          },
          {
            name: 'Deliver Static Assets and Set Cache Policy',
            description:
              'Deliver static assets directly from storage and set cache policy',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument:
                    '\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|ttf|otf|woff|woff2|eot|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|webm|mp3|wav|ogg|css|js|json|xml|html|txt|csv|zip|rar|7z|tar|gz|webmanifest|map|md|yaml|yml)$'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'toolkit-migration-astro-v1'
                }
              },
              {
                type: 'set_cache_policy',
                attributes: {
                  value: 'toolkit-migration-astro-v1'
                }
              },
              {
                type: 'deliver'
              }
            ]
          },
          {
            name: 'Redirect to index.html',
            description: 'Handle directory requests by rewriting to index.html',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '.*/$'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'toolkit-migration-astro-v1'
                }
              },
              {
                type: 'rewrite_request',
                attributes: {
                  value: '${uri}index.html'
                }
              }
            ]
          },
          {
            name: 'Redirect to index.html for Subpaths',
            description: 'Handle subpath requests by rewriting to index.html',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '^(?!.*\/$)(?![\s\S]*\.[a-zA-Z0-9]+$).*'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'toolkit-migration-astro-v1'
                }
              },
              {
                type: 'rewrite_request',
                attributes: {
                  value: '${uri}/index.html'
                }
              }
            ]
          }
        ],
        response: []
      }
    }
  ],
  workloads: [
    {
      name: 'toolkit-migration-astro-v1',
      active: true,
      infrastructure: 1,
      deployments: [
        {
          name: 'toolkit-migration-astro-v1',
          current: true,
          active: true,
          strategy: {
            type: 'default',
            attributes: {
              application: 'toolkit-migration-astro-v1'
            }
          }
        }
      ]
    }
  ]
}
