use anyhow::Result;
use clap::Clap;
use csv::Writer;
use parse_mediawiki_sql::field_types::PageType;
use parse_mediawiki_sql::iterate_sql_insertions;
use parse_mediawiki_sql::schemas::{Category, CategoryLink, InterwikiLink, LanguageLink, Page};
use parse_mediawiki_sql::utils::{memory_map, Mmap};

use std::{
    collections::{HashMap as Map, HashSet as Set},
    convert::TryFrom,
    io,
    path::PathBuf,
};

#[derive(Clap, Debug, Clone)]
pub enum Commands {
    #[clap(name = "langlinks", about = "parse langlinks table")]
    LangLinks,
    #[clap(name = "category", about = "parse category table")]
    Category,
    #[clap(name = "categorylinks", about = "parse categorylinks table")]
    CategoryLinks,
    #[clap(name = "page", about = "parse page table")]
    Page,
    #[clap(name = "iwlinks", about = "parse iwlinks table")]
    Iwlinks,
}

#[derive(Clap, Debug, Clone)]
#[clap(
    version = "1.0",
    author = "romnn <contact@romnn.com>",
    setting = clap::AppSettings::ColoredHelp,
    setting = clap::AppSettings::ArgRequiredElseHelp,
)]
pub struct Opts {
    #[clap(short = 'i', long = "input")]
    pub input_file: String,

    #[clap(short = 'o', long = "output")]
    pub output_file: Option<String>,

    #[clap(subcommand)]
    pub commands: Option<Commands>,
}

fn lang_links<W>(sql: Mmap, mut out: Writer<W>) -> Result<()>
where
    W: io::Write,
{
    out.write_record(&["from", "lang", "title"])?;
    let mut written = 0;
    for link in &mut iterate_sql_insertions::<LanguageLink>(&sql) {
        out.write_record(&[
            link.from.into_inner().to_string(),
            link.lang.to_string(),
            link.title.into_inner(),
        ])?;
        written += 1;
        if written % 1_000_000 == 0 {
            println!("wrote {} rows", written);
        }
    }
    out.flush()?;
    Ok(())
}

fn iwlinks<W>(sql: Mmap, mut out: Writer<W>) -> Result<()>
where
    W: io::Write,
{
    out.write_record(&["from", "prefix", "title"])?;
    let mut written = 0;
    for link in &mut iterate_sql_insertions::<InterwikiLink>(&sql) {
        out.write_record(&[
            link.from.into_inner().to_string(),
            link.prefix.to_string(),
            link.title.into_inner(),
        ])?;
        written += 1;
        if written % 1_000_000 == 0 {
            println!("wrote {} rows", written);
        }
    }
    out.flush()?;
    Ok(())
}

fn category<W>(sql: Mmap, mut out: Writer<W>) -> Result<()>
where
    W: io::Write,
{
    out.write_record(&["id", "title", "pages", "subcats", "files"])?;
    let mut written = 0;
    for cat in &mut iterate_sql_insertions::<Category>(&sql) {
        out.write_record(&[
            cat.id.into_inner().to_string(),
            cat.title.into_inner(),
            cat.pages.into_inner().to_string(),
            cat.subcats.into_inner().to_string(),
            cat.files.into_inner().to_string(),
        ])?;
        written += 1;
        if written % 1_000_000 == 0 {
            println!("wrote {} rows", written);
        }
    }
    out.flush()?;
    Ok(())
}

fn category_links<W>(sql: Mmap, mut out: Writer<W>) -> Result<()>
where
    W: io::Write,
{
    out.write_record(&["from", "to", "collation", "type"])?;
    let mut written = 0;
    for link in &mut iterate_sql_insertions::<CategoryLink>(&sql) {
        let typ: &str = match link.r#type {
            PageType::Page => "page",
            PageType::Subcat => "subcat",
            PageType::File => "file",
        };
        out.write_record(&[
            link.from.into_inner().to_string(),
            link.to.into_inner(),
            link.collation,
            typ.to_string(),
        ])?;
        written += 1;
        if written % 1_000_000 == 0 {
            println!("wrote {} rows", written);
        }
    }
    out.flush()?;
    Ok(())
}

fn page<W>(sql: Mmap, mut out: Writer<W>) -> Result<()>
where
    W: io::Write,
{
    out.write_record(&["id", "namespace", "title", "is_redirect", "lang"])?;
    let mut written = 0;
    for page in &mut iterate_sql_insertions::<Page>(&sql) {
        out.write_record(&[
            page.id.into_inner().to_string(),
            page.namespace.into_inner().to_string(),
            page.title.into_inner().to_string(),
            page.is_redirect.to_string(),
            page.lang.unwrap_or("").to_string(),
        ])?;
        written += 1;
        if written % 1_000_000 == 0 {
            println!("wrote {} rows", written);
        }
    }
    out.flush()?;
    Ok(())
}

fn main() -> Result<()> {
    let opts: Opts = Opts::parse();
    let input_file = PathBuf::try_from(opts.input_file)?;
    let mut default_output_file = input_file.clone();
    default_output_file.set_extension("csv");
    let output_file = opts
        .output_file
        .map(|f| PathBuf::try_from(f))
        .unwrap_or(Ok(default_output_file))?;

    let out = Writer::from_path(output_file.clone())?;
    let sql = unsafe { memory_map(&input_file)? };

    if let Some(ref subcommand) = opts.commands {
        match subcommand {
            Commands::LangLinks => {
                lang_links(sql, out)?;
            }
            Commands::Category => {
                category(sql, out)?;
            }
            Commands::CategoryLinks => {
                category_links(sql, out)?;
            }
            Commands::Iwlinks => {
                iwlinks(sql, out)?;
            }
            Commands::Page => {
                page(sql, out)?;
            }
        }
    }

    println!("done: {}", output_file.as_path().display().to_string());

    // let result: Map<_, _> = parse_mediawiki_sql::iterate_sql_insertions(&sql)
    //     .filter_map(
    //         | cat: Category | {
    //             Some(cat)
    //         }
    //         // |CategoryLink {
    //         //      from,
    //         //      to: PageTitle(to),
    //         //      ..
    //         //  }| {
    //         //     if categories.contains(&to) {
    //         //         Some((from, to))
    //         //     } else {
    //         //         None
    //         //     }
    //         // },
    //     )
    //     .collect();
    // println!("{:?}", result.len());
    // result.into_iter().for_each(|res| {
    //     println!("{:?}", res);
    // });
    Ok(())
}
